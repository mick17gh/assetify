"use server";

import { revalidatePath } from "next/cache";
import { EXCEPTION_STATUS, EXCEPTION_TYPE, PERMISSION_KEYS } from "@/constants";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { ExceptionTransitionError, openException, transitionException } from "@/lib/exception-service";
import type { ExceptionStatus, ExceptionType } from "@/lib/generated/prisma/client";
import { assertPermission } from "@/lib/permissions";
import { requireOrganizationId } from "@/lib/scoping";
import { getRequiredSession } from "@/lib/session";
import { uploadExceptionEvidenceToSpaces } from "@/lib/storage/spaces";

function assertType(value: string): ExceptionType {
  const allowed = new Set<string>(Object.values(EXCEPTION_TYPE));
  if (!allowed.has(value)) throw new ExceptionTransitionError("Choose an exception type.");
  return value as ExceptionType;
}

export async function reportExceptionAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const organizationId = requireOrganizationId(session);
  const assetId = String(formData.get("assetId") ?? "") || null;
  const description = String(formData.get("description") ?? "");
  const type = assertType(String(formData.get("type") ?? ""));

  let branchId: string | null = null;
  if (assetId) {
    const asset = await db.asset.findFirst({
      where: { id: assetId, organizationId },
      select: { branchId: true },
    });
    if (!asset) throw new Error("Asset not found.");
    branchId = asset.branchId;
  }

  const dueRaw = String(formData.get("dueDate") ?? "");
  const dueDate = dueRaw ? new Date(`${dueRaw}T00:00:00.000Z`) : null;

  await openException({
    organizationId,
    assetId,
    branchId,
    type,
    description,
    identifiedById: session.userId,
    dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null,
  });

  revalidatePath("/exceptions");
  revalidatePath("/dashboard");
  if (assetId) revalidatePath(`/assets/${assetId}`);
}

export async function transitionExceptionAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const organizationId = requireOrganizationId(session);
  const toStatus = String(formData.get("toStatus") ?? "") as ExceptionStatus;
  const allowed = new Set<string>(Object.values(EXCEPTION_STATUS));
  if (!allowed.has(toStatus)) throw new ExceptionTransitionError("Choose a status.");

  await transitionException({
    exceptionId: String(formData.get("exceptionId") ?? ""),
    organizationId,
    actorId: session.userId,
    toStatus,
    note: String(formData.get("note") ?? ""),
    assignedToId: String(formData.get("assignedToId") ?? "") || null,
  });

  revalidatePath("/exceptions");
  revalidatePath("/dashboard");
}

export async function uploadExceptionEvidenceAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const organizationId = requireOrganizationId(session);
  const exceptionId = String(formData.get("exceptionId") ?? "");
  const exception = await db.assetException.findFirst({
    where: { id: exceptionId, organizationId },
    select: { id: true, branchId: true },
  });
  if (!exception) throw new Error("Exception not found.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file.");

  const uploaded = await uploadExceptionEvidenceToSpaces(exception.id, file);
  await db.exceptionEvidence.create({
    data: {
      exceptionId: exception.id,
      fileName: uploaded.fileName,
      fileUrl: uploaded.publicUrl,
      uploadedById: session.userId,
    },
  });
  await writeAuditLog({
    actorUserId: session.userId,
    organizationId,
    branchId: exception.branchId,
    action: "exception.evidence",
    entityType: "AssetException",
    entityId: exception.id,
    metadata: { fileName: uploaded.fileName },
  });
  revalidatePath("/exceptions");
}
