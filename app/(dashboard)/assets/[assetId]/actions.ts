"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { assertPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSION_KEYS, ASSET_STATUS, ERROR_MESSAGES, DISPOSAL_METHOD, MAINTENANCE_STATUS } from "@/constants";
import {
  updateAssetDepreciationSchema,
  updateAssetSchema,
  updateAssetStatusSchema,
} from "@/lib/validation/asset";
import { recordDisposalSchema } from "@/lib/validation/disposal";
import { calculateAssetValuation } from "@/lib/depreciation-service";
import { parseOptionalCuid } from "@/lib/validation/helpers";
import { syncReplacementForAsset } from "@/lib/replacement-service";
import { syncRemindersForAsset } from "@/lib/reminder-service";
import { deleteStoredFile, uploadAssetFileToSpaces } from "@/lib/storage/spaces";

export async function uploadAssetPhotoAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const assetId = String(formData.get("assetId") ?? "");
  const file = formData.get("photo");
  if (!assetId || !(file instanceof File)) throw new Error("Invalid photo upload payload.");

  const asset = await db.asset.findFirst({
    where: { id: assetId, organizationId: session.organizationId ?? undefined },
  });
  if (!asset) throw new Error("Asset not found.");

  const { fileName, publicUrl } = await uploadAssetFileToSpaces(assetId, file, "photos");
  await db.assetPhoto.create({
    data: {
      assetId,
      fileName,
      url: publicUrl,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.photo.upload",
    entityType: "AssetPhoto",
    entityId: assetId,
    metadata: { fileName },
  });

  revalidatePath(`/assets/${assetId}`);
}

export async function uploadAssetDocumentAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.DOCUMENT_WRITE);
  const assetId = String(formData.get("assetId") ?? "");
  const file = formData.get("document");
  const documentType = String(formData.get("documentType") ?? "OTHER");
  if (!assetId || !(file instanceof File)) throw new Error("Invalid document upload payload.");

  const asset = await db.asset.findFirst({
    where: { id: assetId, organizationId: session.organizationId ?? undefined },
  });
  if (!asset) throw new Error("Asset not found.");

  const { fileName, publicUrl } = await uploadAssetFileToSpaces(assetId, file, "documents");
  await db.assetDocument.create({
    data: {
      assetId,
      documentType: documentType as
        | "RECEIPT"
        | "WARRANTY_CARD"
        | "MANUAL"
        | "SERVICE_REPORT"
        | "OTHER",
      fileName,
      fileUrl: publicUrl,
      mimeType: file.type || "application/octet-stream",
      uploadedByUserId: session.userId,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.document.upload",
    entityType: "AssetDocument",
    entityId: assetId,
    metadata: { fileName, documentType },
  });

  revalidatePath(`/assets/${assetId}`);
}

export async function updateAssetDetailsAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const assetId = String(formData.get("assetId") ?? "");
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  if (!assetId || !name.trim()) throw new Error("Asset name is required.");

  await db.asset.updateMany({
    where: { id: assetId, organizationId: session.organizationId ?? undefined },
    data: {
      name: name.trim(),
      description: description.trim() || null,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.edit",
    entityType: "Asset",
    entityId: assetId,
    metadata: { fields: ["name", "description"] },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
}

export async function createWorkOrderAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const assetId = String(formData.get("assetId") ?? "");
  const description = String(formData.get("description") ?? "");
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  if (!assetId || !description.trim()) throw new Error("Work order description is required.");

  await db.maintenanceRecord.create({
    data: {
      assetId,
      description: description.trim(),
      serviceDate: dueDateRaw ? new Date(dueDateRaw) : new Date(),
      vendorName: "Internal Work Order",
      status: MAINTENANCE_STATUS.SCHEDULED,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "workorder.create",
    entityType: "MaintenanceRecord",
    entityId: assetId,
    metadata: { description },
  });

  revalidatePath(`/assets/${assetId}`);
}

export async function updateAssetProfileAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const parsed = updateAssetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.asset.updateMany({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    data: {
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
      categoryId: parsed.data.categoryId,
      branchId: parsed.data.branchId,
      departmentId: parseOptionalCuid(parsed.data.departmentId),
      roomId: parseOptionalCuid(parsed.data.roomId),
      shelfId: parseOptionalCuid(parsed.data.shelfId),
      vendorId: parseOptionalCuid(parsed.data.vendorId),
      custodianId: parseOptionalCuid(parsed.data.custodianId),
      purchaseCost: parsed.data.purchaseCost,
      warrantyExpiryDate: parsed.data.warrantyExpiryDate ? new Date(parsed.data.warrantyExpiryDate) : null,
      depreciationUsefulLifeYears: parsed.data.depreciationUsefulLifeYears
        ? Number(parsed.data.depreciationUsefulLifeYears)
        : null,
      depreciationSalvageValue: parsed.data.depreciationSalvageValue
        ? parsed.data.depreciationSalvageValue
        : null,
      depreciationMethodOverride: parsed.data.depreciationMethodOverride
        ? parsed.data.depreciationMethodOverride
        : null,
    },
  });

  await syncReplacementForAsset(parsed.data.assetId);
  await syncRemindersForAsset(parsed.data.assetId);

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.profile.update",
    entityType: "Asset",
    entityId: parsed.data.assetId,
  });

  revalidatePath(`/assets/${parsed.data.assetId}`);
  revalidatePath("/assets");
}

export async function updateAssetDepreciationAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const parsed = updateAssetDepreciationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.asset.updateMany({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    data: {
      depreciationUsefulLifeYears: parsed.data.depreciationUsefulLifeYears
        ? Number(parsed.data.depreciationUsefulLifeYears)
        : null,
      depreciationSalvageValue: parsed.data.depreciationSalvageValue
        ? parsed.data.depreciationSalvageValue
        : null,
      depreciationMethodOverride: parsed.data.depreciationMethodOverride
        ? parsed.data.depreciationMethodOverride
        : null,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.depreciation.update",
    entityType: "Asset",
    entityId: parsed.data.assetId,
  });

  revalidatePath(`/assets/${parsed.data.assetId}`);
  revalidatePath("/assets");
}

export async function updateAssetStatusAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const parsed = updateAssetStatusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const asset = await db.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
  });
  if (!asset) throw new Error("Asset not found.");

  await db.asset.update({
    where: { id: parsed.data.assetId },
    data: { status: parsed.data.status, condition: parsed.data.condition },
  });

  await db.assetStatusHistory.create({
    data: {
      assetId: parsed.data.assetId,
      fromStatus: asset.status,
      toStatus: parsed.data.status,
      note: parsed.data.note,
    },
  });

  await syncReplacementForAsset(parsed.data.assetId);
  revalidatePath(`/assets/${parsed.data.assetId}`);
}

export async function disposeAssetAction(formData: FormData) {
  return recordAssetDisposalAction(formData);
}

export async function recordAssetDisposalAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const parsed = recordDisposalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const asset = await db.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    include: { category: true },
  });
  if (!asset) throw new Error("Asset not found.");

  const policy = await db.depreciationPolicy.findFirst({
    where: {
      organizationId: session.organizationId ?? undefined,
      categoryId: asset.categoryId,
    },
  });

  const valuation = calculateAssetValuation(
    {
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      categoryName: asset.category.name,
      depreciationUsefulLifeYears: asset.depreciationUsefulLifeYears,
      depreciationSalvageValue: asset.depreciationSalvageValue,
      depreciationMethodOverride: asset.depreciationMethodOverride,
    },
    policy
      ? {
          method: policy.method,
          usefulLifeYears: policy.usefulLifeYears,
          salvagePercent: Number(policy.salvagePercent),
        }
      : null,
  );

  const statusMap = {
    [DISPOSAL_METHOD.DONATED]: ASSET_STATUS.DONATED,
    [DISPOSAL_METHOD.SOLD]: ASSET_STATUS.SOLD,
    [DISPOSAL_METHOD.DISPOSED]: ASSET_STATUS.DISPOSED,
  } as const;

  await db.assetDisposalRecord.create({
    data: {
      assetId: asset.id,
      organizationId: session.organizationId ?? "",
      method: parsed.data.method,
      disposalDate: new Date(parsed.data.disposalDate),
      reason: parsed.data.reason,
      salePrice: parsed.data.salePrice ? parsed.data.salePrice : null,
      buyerName: parsed.data.buyerName?.trim() || null,
      buyerContact: parsed.data.buyerContact?.trim() || null,
      bookValueAtDisposal: valuation.currentValue,
      recommendedSalePrice: valuation.recommendedSalePrice,
      disposedByUserId: session.userId,
    },
  });

  await db.asset.update({
    where: { id: asset.id },
    data: { status: statusMap[parsed.data.method], isActive: false },
  });

  await db.assetStatusHistory.create({
    data: {
      assetId: asset.id,
      fromStatus: asset.status,
      toStatus: statusMap[parsed.data.method],
      note: parsed.data.reason,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.dispose",
    entityType: "Asset",
    entityId: asset.id,
    metadata: { method: parsed.data.method },
  });

  revalidatePath(`/assets/${parsed.data.assetId}`);
  revalidatePath("/assets");
  revalidatePath("/reports");
}

export async function deleteAssetPhotoAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const photoId = String(formData.get("photoId") ?? "");
  const photo = await db.assetPhoto.findFirst({
    where: { id: photoId, asset: { organizationId: session.organizationId ?? undefined } },
  });
  if (!photo) throw new Error("Photo not found.");

  try {
    await deleteStoredFile(photo.url);
  } catch {
    // ignore missing file
  }
  await db.assetPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/assets/${photo.assetId}`);
}

export async function deleteAssetDocumentAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.DOCUMENT_WRITE);
  const documentId = String(formData.get("documentId") ?? "");
  const doc = await db.assetDocument.findFirst({
    where: { id: documentId, asset: { organizationId: session.organizationId ?? undefined } },
  });
  if (!doc) throw new Error("Document not found.");

  try {
    await deleteStoredFile(doc.fileUrl);
  } catch {
    // ignore missing file
  }
  await db.assetDocument.delete({ where: { id: documentId } });
  revalidatePath(`/assets/${doc.assetId}`);
}

export async function deleteMaintenanceRecordAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const recordId = String(formData.get("recordId") ?? "");
  const record = await db.maintenanceRecord.findFirst({
    where: { id: recordId, asset: { organizationId: session.organizationId ?? undefined } },
  });
  if (!record) throw new Error("Record not found.");

  await db.maintenanceRecord.delete({ where: { id: recordId } });
  revalidatePath(`/assets/${record.assetId}`);
}
