"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { APP_ROUTES, ERROR_MESSAGES, PERMISSION_KEYS } from "@/constants";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import {
  createConditionFlagSchema,
  createMaintenanceSchema,
  deleteMaintenanceSchema,
  resolveConditionFlagSchema,
  updateMaintenanceSchema,
} from "@/lib/validation/maintenance";
import { ensureHighMaintenanceFlag } from "@/lib/maintenance-service";
import { uploadAssetFileToSpaces } from "@/lib/storage/spaces";
import { DOCUMENT_TYPE } from "@/constants";

async function assertAssetScope(assetId: string, organizationId: string | null) {
  const asset = await db.asset.findFirst({
    where: { id: assetId, organizationId: organizationId ?? undefined },
    select: { id: true, branchId: true },
  });
  if (!asset) throw new Error("Asset not found.");
  return asset;
}

export async function createMaintenanceAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = createMaintenanceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const asset = await assertAssetScope(parsed.data.assetId, session.organizationId);

  await db.maintenanceRecord.create({
    data: {
      assetId: parsed.data.assetId,
      description: parsed.data.description,
      serviceDate: new Date(parsed.data.serviceDate),
      cost: parsed.data.cost ? parsed.data.cost : null,
      vendorName: parsed.data.vendorName?.trim() || null,
      nextServiceDate: parsed.data.nextServiceDate ? new Date(parsed.data.nextServiceDate) : null,
      status: parsed.data.status,
    },
  });

  const fullAsset = await db.asset.findUnique({
    where: { id: parsed.data.assetId },
    include: { organization: { select: { maintenanceCostThresholdPercent: true } } },
  });
  if (fullAsset) {
    await ensureHighMaintenanceFlag(
      parsed.data.assetId,
      Number(fullAsset.purchaseCost),
      fullAsset.organization.maintenanceCostThresholdPercent,
    );
  }

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: asset.branchId,
    action: "maintenance.create",
    entityType: "MaintenanceRecord",
    entityId: parsed.data.assetId,
  });

  revalidatePath(APP_ROUTES.MAINTENANCE);
  revalidatePath(`/assets/${parsed.data.assetId}`);
}

export async function updateMaintenanceAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = updateMaintenanceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const record = await db.maintenanceRecord.findFirst({
    where: { id: parsed.data.id, asset: { organizationId: session.organizationId ?? undefined } },
    include: { asset: { select: { branchId: true } } },
  });
  if (!record) throw new Error("Maintenance record not found.");

  await assertAssetScope(parsed.data.assetId, session.organizationId);

  await db.maintenanceRecord.update({
    where: { id: parsed.data.id },
    data: {
      assetId: parsed.data.assetId,
      description: parsed.data.description,
      serviceDate: new Date(parsed.data.serviceDate),
      cost: parsed.data.cost ? parsed.data.cost : null,
      vendorName: parsed.data.vendorName?.trim() || null,
      nextServiceDate: parsed.data.nextServiceDate ? new Date(parsed.data.nextServiceDate) : null,
      status: parsed.data.status,
    },
  });

  const fullAsset = await db.asset.findUnique({
    where: { id: parsed.data.assetId },
    include: { organization: { select: { maintenanceCostThresholdPercent: true } } },
  });
  if (fullAsset) {
    await ensureHighMaintenanceFlag(
      parsed.data.assetId,
      Number(fullAsset.purchaseCost),
      fullAsset.organization.maintenanceCostThresholdPercent,
    );
  }

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: record.asset.branchId,
    action: "maintenance.update",
    entityType: "MaintenanceRecord",
    entityId: parsed.data.id,
  });

  revalidatePath(APP_ROUTES.MAINTENANCE);
  revalidatePath(`/assets/${parsed.data.assetId}`);
}

export async function deleteMaintenanceAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = deleteMaintenanceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const record = await db.maintenanceRecord.findFirst({
    where: { id: parsed.data.id, asset: { organizationId: session.organizationId ?? undefined } },
    include: { asset: { select: { id: true, branchId: true } } },
  });
  if (!record) throw new Error("Maintenance record not found.");

  await db.maintenanceRecord.delete({
    where: { id: parsed.data.id },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: record.asset.branchId,
    action: "maintenance.delete",
    entityType: "MaintenanceRecord",
    entityId: parsed.data.id,
  });

  revalidatePath(APP_ROUTES.MAINTENANCE);
  revalidatePath(`/assets/${record.asset.id}`);
}

export async function createConditionFlagAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = createConditionFlagSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const asset = await assertAssetScope(parsed.data.assetId, session.organizationId);

  await db.conditionFlag.create({
    data: {
      assetId: parsed.data.assetId,
      title: parsed.data.title,
      severity: parsed.data.severity,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: asset.branchId,
    action: "condition-flag.create",
    entityType: "ConditionFlag",
    entityId: parsed.data.assetId,
  });

  revalidatePath(APP_ROUTES.MAINTENANCE);
  revalidatePath(`/assets/${parsed.data.assetId}`);
}

export async function resolveConditionFlagAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const parsed = resolveConditionFlagSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const flag = await db.conditionFlag.findFirst({
    where: { id: parsed.data.id, asset: { organizationId: session.organizationId ?? undefined } },
    include: { asset: { select: { id: true, branchId: true } } },
  });
  if (!flag) throw new Error("Condition flag not found.");

  await db.conditionFlag.update({
    where: { id: parsed.data.id },
    data: { resolvedAt: new Date() },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: flag.asset.branchId,
    action: "condition-flag.resolve",
    entityType: "ConditionFlag",
    entityId: parsed.data.id,
  });

  revalidatePath(APP_ROUTES.MAINTENANCE);
  revalidatePath(`/assets/${flag.asset.id}`);
}

export async function uploadMaintenanceDocumentAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.DOCUMENT_WRITE);

  const recordId = String(formData.get("recordId") ?? "").trim();
  const file = formData.get("document");
  if (!recordId) throw new Error("Maintenance record is required.");
  if (!(file instanceof File) || file.size === 0) throw new Error("Please choose an invoice file to upload.");

  const record = await db.maintenanceRecord.findFirst({
    where: { id: recordId, asset: { organizationId: session.organizationId ?? undefined } },
    include: { asset: { select: { id: true, branchId: true } } },
  });
  if (!record) throw new Error("Maintenance record not found.");

  const { fileName: storedFileName, publicUrl } = await uploadAssetFileToSpaces(record.asset.id, file, "documents");
  const displayName = file.name?.trim() || storedFileName;
  await db.assetDocument.create({
    data: {
      assetId: record.asset.id,
      maintenanceRecordId: record.id,
      documentType: DOCUMENT_TYPE.MAINTENANCE_INVOICE,
      fileName: displayName,
      fileUrl: publicUrl,
      mimeType: file.type || "application/octet-stream",
      uploadedByUserId: session.userId,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: record.asset.branchId,
    action: "maintenance.document.upload",
    entityType: "MaintenanceRecord",
    entityId: record.id,
    metadata: { fileName: displayName },
  });

  revalidatePath(APP_ROUTES.MAINTENANCE);
  revalidatePath(`/assets/${record.asset.id}`);
}
