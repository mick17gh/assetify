"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  APP_ROUTES,
  ASSET_REQUEST_STATUS,
  ASSET_STATUS,
  ASSET_CONDITION,
  ERROR_MESSAGES,
  PERMISSION_KEYS,
  USER_ROLES,
} from "@/constants";
import { assertPermission, canAccessBranch } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import {
  createAssetRequestSchema,
  reviewAssetRequestSchema,
  fulfillAssetRequestSchema,
} from "@/lib/validation/asset-request";
import { parseOptionalCuid } from "@/lib/validation/helpers";
import { syncReplacementForAsset } from "@/lib/replacement-service";
import {
  sendAssetRequestDecisionEmail,
  sendAssetRequestSubmittedEmail,
} from "@/lib/services/email";

function orgId(session: Awaited<ReturnType<typeof getRequiredSession>>) {
  if (!session.organizationId) throw new Error(ERROR_MESSAGES.FORBIDDEN);
  return session.organizationId;
}

export async function createAssetRequestAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_REQUEST);

  const parsed = createAssetRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const branchId = session.branchId;
  if (!branchId) throw new Error("Branch is required to submit a request.");

  const request = await db.assetRequest.create({
    data: {
      requesterId: session.userId,
      organizationId: orgId(session),
      branchId,
      departmentId: parseOptionalCuid(parsed.data.departmentId),
      categoryId: parsed.data.categoryId,
      reason: parsed.data.reason,
      urgency: parsed.data.urgency,
      notes: parsed.data.notes?.trim() || null,
      status: ASSET_REQUEST_STATUS.PENDING,
    },
    include: {
      requester: { select: { name: true, email: true } },
      category: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId,
    action: "asset.request.create",
    entityType: "AssetRequest",
    entityId: request.id,
  });

  const managers = await db.user.findMany({
    where: {
      organizationId: orgId(session),
      branchId,
      isActive: true,
      role: { in: [USER_ROLES.MANAGER, USER_ROLES.ADMIN] },
    },
    select: { id: true, email: true, name: true },
  });

  await Promise.all(
    managers.map(async (manager) => {
      const subject = `New asset request: ${request.category.name}`;
      const body = `${request.requester.name} submitted an asset request for ${request.category.name}. Reason: ${request.reason}`;
      await sendAssetRequestSubmittedEmail({
        to: manager.email,
        managerName: manager.name,
        requesterName: request.requester.name,
        categoryName: request.category.name,
        reason: request.reason,
        urgency: request.urgency,
        requestId: request.id,
      });
      await db.notificationLog.create({
        data: {
          userId: manager.id,
          type: "ASSET_REQUEST_SUBMITTED",
          subject,
          body,
        },
      });
    }),
  );

  revalidatePath(APP_ROUTES.ASSET_REQUESTS);
}

export async function reviewAssetRequestAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_APPROVE);

  const parsed = reviewAssetRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const request = await db.assetRequest.findFirst({
    where: {
      id: parsed.data.id,
      organizationId: orgId(session),
      status: ASSET_REQUEST_STATUS.PENDING,
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      category: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });
  if (!request) throw new Error("Request not found or already reviewed.");
  if (!canAccessBranch(session.role, session.branchId, request.branchId)) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }

  if (parsed.data.decision === ASSET_REQUEST_STATUS.REJECTED) {
    await db.assetRequest.update({
      where: { id: request.id },
      data: {
        status: ASSET_REQUEST_STATUS.REJECTED,
        reviewerId: session.userId,
        reviewComment: parsed.data.reviewComment?.trim() || null,
        reviewedAt: new Date(),
      },
    });

    await sendAssetRequestDecisionEmail({
      to: request.requester.email,
      requesterName: request.requester.name,
      categoryName: request.category.name,
      approved: false,
      comment: parsed.data.reviewComment,
    });
    await db.notificationLog.create({
      data: {
        userId: request.requester.id,
        type: "ASSET_REQUEST_REJECTED",
        subject: `Your asset request was rejected`,
        body: `Your request for ${request.category.name} was rejected.${parsed.data.reviewComment ? ` Comment: ${parsed.data.reviewComment}` : ""}`,
      },
    });
  } else {
    const suffix = request.id.slice(-8).toUpperCase();
    const placeholderAsset = await db.asset.create({
      data: {
        ain: `PEND-${suffix}`,
        serialNumber: `PEND-SN-${suffix}`,
        name: `Pending: ${request.category.name} for ${request.requester.name}`,
        description: `Created from approved request. Reason: ${request.reason}`,
        purchaseDate: new Date(),
        purchaseCost: 0,
        status: ASSET_STATUS.IN_STORAGE,
        condition: ASSET_CONDITION.GOOD,
        branchId: request.branchId,
        departmentId: request.departmentId,
        categoryId: request.categoryId,
        custodianId: request.requesterId,
        organizationId: orgId(session),
      },
    });

    await db.assetStatusHistory.create({
      data: {
        assetId: placeholderAsset.id,
        fromStatus: null,
        toStatus: ASSET_STATUS.IN_STORAGE,
        note: "Created from approved asset request",
      },
    });

    await syncReplacementForAsset(placeholderAsset.id);

    await db.assetRequest.update({
      where: { id: request.id },
      data: {
        status: ASSET_REQUEST_STATUS.APPROVED,
        reviewerId: session.userId,
        reviewComment: parsed.data.reviewComment?.trim() || null,
        reviewedAt: new Date(),
        fulfilledAssetId: placeholderAsset.id,
      },
    });

    await sendAssetRequestDecisionEmail({
      to: request.requester.email,
      requesterName: request.requester.name,
      categoryName: request.category.name,
      approved: true,
      comment: parsed.data.reviewComment,
      assetId: placeholderAsset.id,
    });
    await db.notificationLog.create({
      data: {
        userId: request.requester.id,
        type: "ASSET_REQUEST_APPROVED",
        subject: `Your asset request was approved`,
        body: `Your request for ${request.category.name} was approved.${parsed.data.reviewComment ? ` Comment: ${parsed.data.reviewComment}` : ""}`,
      },
    });
  }

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: request.branchId,
    action: "asset.request.review",
    entityType: "AssetRequest",
    entityId: request.id,
    metadata: { decision: parsed.data.decision },
  });

  revalidatePath(APP_ROUTES.ASSET_REQUESTS);
  revalidatePath(APP_ROUTES.ASSETS);
}

export async function fulfillAssetRequestAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = fulfillAssetRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const request = await db.assetRequest.findFirst({
    where: {
      id: parsed.data.id,
      organizationId: orgId(session),
      status: ASSET_REQUEST_STATUS.APPROVED,
    },
  });
  if (!request) throw new Error("Approved request not found.");

  await db.assetRequest.update({
    where: { id: request.id },
    data: { status: ASSET_REQUEST_STATUS.FULFILLED },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: request.branchId,
    action: "asset.request.fulfill",
    entityType: "AssetRequest",
    entityId: request.id,
  });

  revalidatePath(APP_ROUTES.ASSET_REQUESTS);
}
