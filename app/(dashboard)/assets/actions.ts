"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { APP_ROUTES, ASSET_CONDITION, ASSET_STATUS, ERROR_MESSAGES, PERMISSION_KEYS } from "@/constants";
import { assertPermission, canAccessBranch } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { createAssetSchema } from "@/lib/validation/asset";
import { parseOptionalCuid } from "@/lib/validation/helpers";
import { syncReplacementForAsset } from "@/lib/replacement-service";
import { syncRemindersForAsset } from "@/lib/reminder-service";

export async function createAssetAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = createAssetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  if (!canAccessBranch(session.role, session.branchId, parsed.data.branchId)) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }

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
      status: parsed.data.status ?? ASSET_STATUS.ACTIVE,
      condition: parsed.data.condition ?? ASSET_CONDITION.GOOD,
      organizationId: session.organizationId ?? "",
    },
  });

  await db.assetStatusHistory.create({
    data: {
      assetId: asset.id,
      fromStatus: null,
      toStatus: asset.status,
      note: "Asset created",
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
