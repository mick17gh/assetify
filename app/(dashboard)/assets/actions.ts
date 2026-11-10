"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { APP_ROUTES, ASSET_CONDITION, ASSET_STATUS, ERROR_MESSAGES, OWNERSHIP_TYPE, PERMISSION_KEYS } from "@/constants";
import { assertPermission, canAccessBranch } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { createAssetSchema } from "@/lib/validation/asset";
import { formatZodError, parseOptionalCuid } from "@/lib/validation/helpers";
import { syncReplacementForAsset } from "@/lib/replacement-service";
import { syncRemindersForAsset } from "@/lib/reminder-service";

function optionalDate(value?: string) {
  return value ? new Date(value) : null;
}

export async function createAssetAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = createAssetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(formatZodError(parsed.error));

  if (!canAccessBranch(session.role, session.branchId, parsed.data.branchId)) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }

  const status = parsed.data.status ?? ASSET_STATUS.PENDING_ONBOARDING;
  const asset = await db.asset.create({
    data: {
      ain: parsed.data.ain,
      serialNumber: parsed.data.serialNumber,
      name: parsed.data.name,
      purchaseDate: new Date(parsed.data.purchaseDate),
      purchaseCost: parsed.data.purchaseCost,
      categoryId: parsed.data.categoryId,
      branchId: parsed.data.branchId,
      departmentId: parseOptionalCuid(parsed.data.departmentId),
      roomId: parseOptionalCuid(parsed.data.roomId),
      shelfId: parseOptionalCuid(parsed.data.shelfId),
      vendorId: parseOptionalCuid(parsed.data.vendorId),
      custodianId: parseOptionalCuid(parsed.data.custodianId),
      warrantyExpiryDate: parsed.data.warrantyExpiryDate
        ? new Date(parsed.data.warrantyExpiryDate)
        : null,
      status,
      condition: parsed.data.condition ?? ASSET_CONDITION.NEW,
      manufacturer: parsed.data.manufacturer || null,
      modelName: parsed.data.modelName || null,
      existingAssetNumber: parsed.data.existingAssetNumber || null,
      poNumber: parsed.data.poNumber?.trim() || null,
      invoiceNumber: parsed.data.invoiceNumber?.trim() || null,
      invoiceUrl: parsed.data.invoiceUrl?.trim() || null,
      capitalizedDate: optionalDate(parsed.data.capitalizedDate),
      ownershipType: parsed.data.ownershipType ?? OWNERSHIP_TYPE.OWNED,
      lessorName: parsed.data.lessorName?.trim() || null,
      leaseStartDate: optionalDate(parsed.data.leaseStartDate),
      leaseEndDate: optionalDate(parsed.data.leaseEndDate),
      leaseMonthlyCost: parsed.data.leaseMonthlyCost || null,
      onboardingCompletedAt: status === ASSET_STATUS.PENDING_ONBOARDING ? null : new Date(),
      organizationId: session.organizationId ?? "",
    },
  });

  await db.assetStatusHistory.create({
    data: {
      assetId: asset.id,
      fromStatus: null,
      toStatus: asset.status,
      note: status === ASSET_STATUS.PENDING_ONBOARDING ? "Asset created — pending onboarding" : "Asset created",
    },
  });

  await syncReplacementForAsset(asset.id);
  await syncRemindersForAsset(asset.id);

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: parsed.data.branchId,
    action: "asset.create",
    entityType: "Asset",
    entityId: asset.id,
    metadata: { ain: parsed.data.ain },
  });

  revalidatePath(APP_ROUTES.ASSETS);
}
