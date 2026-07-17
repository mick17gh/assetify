"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { APP_ROUTES, ASSET_STATUS, ERROR_MESSAGES, PERMISSION_KEYS, USER_ROLES } from "@/constants";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { recomputeReplacementForOrg } from "@/lib/replacement-service";
import { acknowledgeDisposalSchema, recomputeReplacementSchema } from "@/lib/validation/replacement";
import { formatZodError } from "@/lib/validation/helpers";

export async function recomputeReplacementAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  if (!session.organizationId) throw new Error(ERROR_MESSAGES.FORBIDDEN);

  const parsed = recomputeReplacementSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(formatZodError(parsed.error));

  const targetBranchId =
    parsed.data.branchId ||
    (session.role === USER_ROLES.ADMIN ? undefined : session.branchId || undefined);
  await recomputeReplacementForOrg(session.organizationId, targetBranchId);

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: targetBranchId ?? null,
    action: "replacement.recompute",
    entityType: "ReplacementEvaluation",
    metadata: { branchId: targetBranchId ?? null },
  });

  revalidatePath(APP_ROUTES.REPLACEMENT);
  revalidatePath(APP_ROUTES.REPORTS);
  revalidatePath(APP_ROUTES.DASHBOARD);
}

export async function acknowledgeDisposalAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = acknowledgeDisposalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(formatZodError(parsed.error));

  const asset = await db.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    select: { id: true, branchId: true },
  });
  if (!asset) throw new Error("Asset not found.");

  await db.asset.update({
    where: { id: asset.id },
    data: { status: ASSET_STATUS.DISPOSED, isActive: false },
  });

  await db.replacementEvaluation.deleteMany({ where: { assetId: asset.id } });

  await db.disposalRecommendation.create({
    data: {
      assetId: asset.id,
      state: "OVERDUE",
      recommendedAt: new Date(),
      reason: parsed.data.reason || "Disposal acknowledgement captured from replacement workflow.",
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: asset.branchId,
    action: "replacement.disposal.acknowledge",
    entityType: "DisposalRecommendation",
    entityId: asset.id,
  });

  revalidatePath(APP_ROUTES.REPLACEMENT);
  revalidatePath(APP_ROUTES.REPORTS);
  revalidatePath(`/assets/${asset.id}`);
}
