"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { APP_ROUTES, DOCUMENT_TYPE, ERROR_MESSAGES, PERMISSION_KEYS } from "@/constants";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { deleteDocumentSchema, updateDocumentSchema } from "@/lib/validation/document";
import { enumFromConst } from "@/lib/validation/helpers";
import { deleteStoredFile, uploadAssetFileToSpaces } from "@/lib/storage/spaces";

const createDocumentSchema = z.object({
  assetId: z.string().cuid(),
  documentType: enumFromConst(DOCUMENT_TYPE),
  displayName: z.string().trim().min(1).max(200),
});

export async function uploadDocumentFromRepositoryAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.DOCUMENT_WRITE);

  const file = formData.get("document");
  if (!(file instanceof File)) throw new Error("Document file is required.");

  const parsed = createDocumentSchema.safeParse({
    assetId: String(formData.get("assetId") ?? ""),
    documentType: String(formData.get("documentType") ?? ""),
    displayName: String(formData.get("displayName") ?? "").trim() || file.name,
  });
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const asset = await db.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    select: { id: true, branchId: true },
  });
  if (!asset) throw new Error("Asset not found.");

  const { fileName, publicUrl } = await uploadAssetFileToSpaces(parsed.data.assetId, file, "documents");

  await db.assetDocument.create({
    data: {
      assetId: parsed.data.assetId,
      documentType: parsed.data.documentType,
      displayName: parsed.data.displayName,
      fileName,
      fileUrl: publicUrl,
      mimeType: file.type || "application/octet-stream",
      uploadedByUserId: session.userId,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: asset.branchId,
    action: "document.repository.upload",
    entityType: "AssetDocument",
    entityId: parsed.data.assetId,
    metadata: { fileName, displayName: parsed.data.displayName, documentType: parsed.data.documentType },
  });

  revalidatePath(APP_ROUTES.DOCUMENTS);
  revalidatePath(`/assets/${parsed.data.assetId}`);
}

export async function updateDocumentTypeAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.DOCUMENT_WRITE);

  const parsed = updateDocumentSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    documentType: String(formData.get("documentType") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  });
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const doc = await db.assetDocument.findFirst({
    where: { id: parsed.data.id, asset: { organizationId: session.organizationId ?? undefined } },
    include: { asset: { select: { id: true, branchId: true } } },
  });
  if (!doc) throw new Error("Document not found.");

  const file = formData.get("document");
  const hasNewFile = file instanceof File && file.size > 0;

  let fileName = doc.fileName;
  let fileUrl = doc.fileUrl;
  let mimeType = doc.mimeType;

  if (hasNewFile) {
    const uploaded = await uploadAssetFileToSpaces(doc.asset.id, file, "documents");
    try {
      await deleteStoredFile(doc.fileUrl);
    } catch {
      // ignore missing previous file
    }
    fileName = uploaded.fileName;
    fileUrl = uploaded.publicUrl;
    mimeType = file.type || "application/octet-stream";
  }

  await db.assetDocument.update({
    where: { id: parsed.data.id },
    data: {
      documentType: parsed.data.documentType,
      displayName: parsed.data.displayName,
      fileName,
      fileUrl,
      mimeType,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: doc.asset.branchId,
    action: "document.type.update",
    entityType: "AssetDocument",
    entityId: parsed.data.id,
    metadata: {
      documentType: parsed.data.documentType,
      displayName: parsed.data.displayName,
      replacedFile: hasNewFile,
    },
  });

  revalidatePath(APP_ROUTES.DOCUMENTS);
  revalidatePath(`/assets/${doc.asset.id}`);
}

export async function deleteDocumentFromRepositoryAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.DOCUMENT_WRITE);

  const parsed = deleteDocumentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const doc = await db.assetDocument.findFirst({
    where: { id: parsed.data.id, asset: { organizationId: session.organizationId ?? undefined } },
    include: { asset: { select: { id: true, branchId: true } } },
  });
  if (!doc) throw new Error("Document not found.");

  try {
    await deleteStoredFile(doc.fileUrl);
  } catch {
    // ignore missing file
  }

  await db.assetDocument.delete({ where: { id: parsed.data.id } });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: doc.asset.branchId,
    action: "document.delete",
    entityType: "AssetDocument",
    entityId: parsed.data.id,
  });

  revalidatePath(APP_ROUTES.DOCUMENTS);
  revalidatePath(`/assets/${doc.asset.id}`);
}
