"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { assertPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { diffFields } from "@/lib/audit-changes";
import {
  PERMISSION_KEYS,
  ASSET_STATUS,
  ASSET_CONDITION,
  ERROR_MESSAGES,
  DISPOSAL_METHOD,
  MAINTENANCE_STATUS,
  REGEX,
  USER_ROLES,
} from "@/constants";
import {
  completeAssetOnboardingSchema,
  updateAssetDepreciationSchema,
  updateAssetSchema,
  updateAssetStatusSchema,
} from "@/lib/validation/asset";
import { recordDisposalSchema } from "@/lib/validation/disposal";
import { calculateAssetValuation } from "@/lib/depreciation-service";
import { formatZodError, parseOptionalCuid } from "@/lib/validation/helpers";
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
  const displayName = String(formData.get("displayName") ?? "").trim() || file.name || fileName;
  await db.assetDocument.create({
    data: {
      assetId,
      documentType: documentType as
        | "RECEIPT"
        | "WARRANTY_CARD"
        | "MANUAL"
        | "SERVICE_REPORT"
        | "OTHER",
      displayName,
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
    metadata: { fileName, displayName, documentType },
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

  const before = await db.asset.findFirst({
    where: { id: assetId, organizationId: session.organizationId ?? undefined },
    select: {
      name: true,
      description: true,
      manufacturer: true,
      modelName: true,
      existingAssetNumber: true,
      categoryId: true,
      purchaseCost: true,
      poNumber: true,
      invoiceNumber: true,
      invoiceUrl: true,
      capitalizedDate: true,
      ownershipType: true,
      lessorName: true,
      leaseStartDate: true,
      leaseEndDate: true,
      leaseMonthlyCost: true,
    },
  });
  if (!before) throw new Error("Asset not found.");

  const isAdmin = session.role === USER_ROLES.ADMIN;
  const fields = [
    "name",
    "description",
    "manufacturer",
    "modelName",
    "existingAssetNumber",
    "poNumber",
    "invoiceNumber",
    "invoiceUrl",
    "capitalizedDate",
    "ownershipType",
    "lessorName",
    "leaseStartDate",
    "leaseEndDate",
    "leaseMonthlyCost",
  ];
  const capitalizedRaw = String(formData.get("capitalizedDate") ?? "").trim();
  const leaseStartRaw = String(formData.get("leaseStartDate") ?? "").trim();
  const leaseEndRaw = String(formData.get("leaseEndDate") ?? "").trim();
  const leaseCostRaw = String(formData.get("leaseMonthlyCost") ?? "").trim();
  const ownershipType = String(formData.get("ownershipType") || before.ownershipType || "OWNED");
  const data: {
    name: string;
    description: string | null;
    manufacturer: string | null;
    modelName: string | null;
    existingAssetNumber: string | null;
    poNumber: string | null;
    invoiceNumber: string | null;
    invoiceUrl: string | null;
    capitalizedDate: Date | null;
    ownershipType: "OWNED" | "RENTED" | "LEASED" | "DONATED_IN";
    lessorName: string | null;
    leaseStartDate: Date | null;
    leaseEndDate: Date | null;
    leaseMonthlyCost: string | null;
    categoryId?: string;
    purchaseCost?: string;
  } = {
    name: name.trim(),
    description: description.trim() || null,
    manufacturer: String(formData.get("manufacturer") ?? "").trim() || null,
    modelName: String(formData.get("modelName") ?? "").trim() || null,
    existingAssetNumber: String(formData.get("existingAssetNumber") ?? "").trim() || null,
    poNumber: String(formData.get("poNumber") ?? "").trim() || null,
    invoiceNumber: String(formData.get("invoiceNumber") ?? "").trim() || null,
    invoiceUrl: String(formData.get("invoiceUrl") ?? "").trim() || null,
    capitalizedDate: capitalizedRaw ? new Date(capitalizedRaw) : null,
    ownershipType: ownershipType as "OWNED" | "RENTED" | "LEASED" | "DONATED_IN",
    lessorName: String(formData.get("lessorName") ?? "").trim() || null,
    leaseStartDate: leaseStartRaw ? new Date(leaseStartRaw) : null,
    leaseEndDate: leaseEndRaw ? new Date(leaseEndRaw) : null,
    leaseMonthlyCost: leaseCostRaw || null,
  };

  if (isAdmin) {
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const purchaseCost = String(formData.get("purchaseCost") ?? "").trim();
    if (!categoryId) throw new Error("Category is required.");
    if (!REGEX.CURRENCY.test(purchaseCost)) throw new Error("Invalid purchase cost.");

    const category = await db.category.findFirst({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw new Error("Category not found.");

    data.categoryId = categoryId;
    data.purchaseCost = purchaseCost;
    fields.push("categoryId", "purchaseCost");
  }

  await db.asset.updateMany({
    where: { id: assetId, organizationId: session.organizationId ?? undefined },
    data,
  });

  if (isAdmin) {
    await syncReplacementForAsset(assetId);
    await syncRemindersForAsset(assetId);
  }

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.edit",
    entityType: "Asset",
    entityId: assetId,
    metadata: {
      fields,
      changes: diffFields(
        {
          name: before.name,
          description: before.description,
          manufacturer: before.manufacturer,
          modelName: before.modelName,
          existingAssetNumber: before.existingAssetNumber,
          categoryId: before.categoryId,
          purchaseCost: String(before.purchaseCost),
        },
        {
          name: data.name,
          description: data.description,
          manufacturer: data.manufacturer,
          modelName: data.modelName,
          existingAssetNumber: data.existingAssetNumber,
          categoryId: data.categoryId ?? before.categoryId,
          purchaseCost: data.purchaseCost ?? String(before.purchaseCost),
        },
        fields,
      ),
    },
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

  const before = await db.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
  });
  if (!before) throw new Error("Asset not found.");

  const after = {
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
  };

  await db.asset.updateMany({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    data: {
      ...after,
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
    metadata: {
      changes: diffFields(
        {
          name: before.name,
          description: before.description,
          categoryId: before.categoryId,
          branchId: before.branchId,
          departmentId: before.departmentId,
          roomId: before.roomId,
          shelfId: before.shelfId,
          vendorId: before.vendorId,
          custodianId: before.custodianId,
          purchaseCost: String(before.purchaseCost),
        },
        {
          ...after,
          purchaseCost: String(after.purchaseCost),
        },
        [
          "name",
          "description",
          "categoryId",
          "branchId",
          "departmentId",
          "roomId",
          "shelfId",
          "vendorId",
          "custodianId",
          "purchaseCost",
        ],
      ),
    },
  });

  revalidatePath(`/assets/${parsed.data.assetId}`);
  revalidatePath("/assets");
}

export async function updateAssetDepreciationAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const parsed = updateAssetDepreciationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const before = await db.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    select: {
      depreciationUsefulLifeYears: true,
      depreciationSalvageValue: true,
      depreciationMethodOverride: true,
    },
  });
  if (!before) throw new Error("Asset not found.");

  const after = {
    depreciationUsefulLifeYears: parsed.data.depreciationUsefulLifeYears
      ? Number(parsed.data.depreciationUsefulLifeYears)
      : null,
    depreciationSalvageValue: parsed.data.depreciationSalvageValue ? parsed.data.depreciationSalvageValue : null,
    depreciationMethodOverride: parsed.data.depreciationMethodOverride
      ? parsed.data.depreciationMethodOverride
      : null,
  };

  await db.asset.updateMany({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    data: after,
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.depreciation.update",
    entityType: "Asset",
    entityId: parsed.data.assetId,
    metadata: {
      changes: diffFields(
        {
          depreciationUsefulLifeYears: before.depreciationUsefulLifeYears,
          depreciationSalvageValue:
            before.depreciationSalvageValue != null ? String(before.depreciationSalvageValue) : null,
          depreciationMethodOverride: before.depreciationMethodOverride,
        },
        {
          depreciationUsefulLifeYears: after.depreciationUsefulLifeYears,
          depreciationSalvageValue:
            after.depreciationSalvageValue != null ? String(after.depreciationSalvageValue) : null,
          depreciationMethodOverride: after.depreciationMethodOverride,
        },
        ["depreciationUsefulLifeYears", "depreciationSalvageValue", "depreciationMethodOverride"],
      ),
    },
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

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId ?? asset.branchId,
    action: "asset.status.update",
    entityType: "Asset",
    entityId: parsed.data.assetId,
    metadata: {
      changes: diffFields(
        { status: asset.status, condition: asset.condition },
        { status: parsed.data.status, condition: parsed.data.condition },
        ["status", "condition"],
      ),
      note: parsed.data.note || null,
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

  const recommendation = await db.disposalRecommendation.findFirst({
    where: { assetId: asset.id, approvalStatus: "APPROVED" },
    orderBy: { recommendedAt: "desc" },
  });
  if (!recommendation) {
    throw new Error("Record Disposal is refused until a disposal recommendation is approved.");
  }

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
          decliningRatePercent: policy.decliningRatePercent != null ? Number(policy.decliningRatePercent) : null,
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

  const evidence = formData.get("evidence");
  if (evidence instanceof File && evidence.size > 0) {
    const uploaded = await uploadAssetFileToSpaces(asset.id, evidence, "documents");
    await db.assetDocument.create({
      data: {
        assetId: asset.id,
        documentType: "DISPOSAL_EVIDENCE",
        displayName: evidence.name || "Disposal evidence",
        fileName: uploaded.fileName,
        fileUrl: uploaded.publicUrl,
        mimeType: evidence.type || "application/octet-stream",
        uploadedByUserId: session.userId,
      },
    });
  }

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId ?? asset.branchId,
    action: "asset.dispose",
    entityType: "Asset",
    entityId: asset.id,
    metadata: {
      method: parsed.data.method,
      changes: [
        { field: "status", from: asset.status, to: statusMap[parsed.data.method] },
        { field: "isActive", from: true, to: false },
        { field: "disposalMethod", from: null, to: parsed.data.method },
        { field: "disposalReason", from: null, to: parsed.data.reason },
        ...(parsed.data.salePrice
          ? [{ field: "salePrice", from: null, to: String(parsed.data.salePrice) }]
          : []),
      ],
    },
  });

  revalidatePath(`/assets/${parsed.data.assetId}`);
  revalidatePath("/assets");
  revalidatePath("/reports");
}

export async function recommendDisposalAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const assetId = String(formData.get("assetId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const recommendedAction = String(formData.get("recommendedAction") ?? "").trim();
  const condition = String(formData.get("condition") ?? "");
  if (!assetId || reason.length < 3 || recommendedAction.length < 2) throw new Error("Reason and recommended action are required.");
  if (!Object.values(ASSET_CONDITION).includes(condition as never)) throw new Error("Condition is required.");

  const asset = await db.asset.findFirst({
    where: { id: assetId, organizationId: session.organizationId ?? undefined },
    select: { id: true, status: true },
  });
  if (!asset) throw new Error("Asset not found.");

  await db.disposalRecommendation.create({
    data: {
      assetId,
      state: "APPROACHING",
      recommendedAt: new Date(),
      reason,
      condition: condition as never,
      recommendedAction,
      approvalStatus: "PENDING",
    },
  });
  await db.asset.update({ where: { id: assetId }, data: { status: ASSET_STATUS.PENDING_DISPOSAL } });
  await db.assetStatusHistory.create({
    data: { assetId, fromStatus: asset.status, toStatus: ASSET_STATUS.PENDING_DISPOSAL, note: reason },
  });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
}

export async function decideDisposalRecommendationAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_APPROVE);
  const assetId = String(formData.get("assetId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "APPROVED" && decision !== "REJECTED") throw new Error("Choose approve or reject.");
  const recommendation = await db.disposalRecommendation.findFirst({
    where: { assetId, asset: { organizationId: session.organizationId ?? undefined }, approvalStatus: "PENDING" },
    orderBy: { recommendedAt: "desc" },
  });
  if (!recommendation) throw new Error("There is no pending disposal recommendation.");
  await db.disposalRecommendation.update({
    where: { id: recommendation.id },
    data: {
      approvalStatus: decision,
      approvedById: session.userId,
      approvedAt: new Date(),
    },
  });
  if (decision === "REJECTED") {
    await db.asset.update({ where: { id: assetId }, data: { status: ASSET_STATUS.ACTIVE } });
  }
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
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

export async function completeAssetOnboardingAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const parsed = completeAssetOnboardingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(formatZodError(parsed.error));

  const asset = await db.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
  });
  if (!asset) throw new Error("Asset not found.");
  if (asset.status !== ASSET_STATUS.PENDING_ONBOARDING && !asset.ain.startsWith("PEND-")) {
    throw new Error("Asset is not pending onboarding.");
  }

  const nextAin = parsed.data.ain?.trim() || asset.ain;
  const nextSerial = parsed.data.serialNumber?.trim() || asset.serialNumber;
  const nextCost = parsed.data.purchaseCost?.trim() || String(asset.purchaseCost);
  if (nextAin.startsWith("PEND-") || nextSerial.startsWith("PEND-")) {
    throw new Error("Replace placeholder AIN and serial before completing onboarding.");
  }
  if (Number(nextCost) <= 0) {
    throw new Error("Enter a purchase cost greater than zero.");
  }

  await db.asset.update({
    where: { id: asset.id },
    data: {
      ain: nextAin,
      serialNumber: nextSerial,
      purchaseCost: nextCost,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : asset.purchaseDate,
      poNumber: parsed.data.poNumber?.trim() || asset.poNumber,
      invoiceNumber: parsed.data.invoiceNumber?.trim() || asset.invoiceNumber,
      invoiceUrl: parsed.data.invoiceUrl?.trim() || asset.invoiceUrl,
      capitalizedDate: parsed.data.capitalizedDate ? new Date(parsed.data.capitalizedDate) : asset.capitalizedDate,
      status: ASSET_STATUS.ACTIVE,
      onboardingCompletedAt: new Date(),
    },
  });

  await db.assetStatusHistory.create({
    data: {
      assetId: asset.id,
      fromStatus: asset.status,
      toStatus: ASSET_STATUS.ACTIVE,
      note: parsed.data.note?.trim() || "Onboarding completed",
    },
  });

  await syncReplacementForAsset(asset.id);
  await syncRemindersForAsset(asset.id);

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId ?? asset.branchId,
    action: "asset.onboarding.complete",
    entityType: "Asset",
    entityId: asset.id,
  });

  revalidatePath(`/assets/${asset.id}`);
  revalidatePath("/assets");
  revalidatePath("/requests");
}
