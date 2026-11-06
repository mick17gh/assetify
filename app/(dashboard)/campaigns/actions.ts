"use server";

import { revalidatePath } from "next/cache";
import { uploadAssetFileToSpaces } from "@/lib/storage/spaces";
import { redirect } from "next/navigation";
import { CAMPAIGN_STATUS, PERMISSION_KEYS, VERIFICATION_OUTCOME } from "@/constants";
import {
  activateCampaign,
  changeCampaignStatus,
  getCampaignForOrg,
  recordVerification,
} from "@/lib/campaign-service";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import type { CampaignStatus, VerificationOutcome } from "@/lib/generated/prisma/client";
import { assertPermission } from "@/lib/permissions";
import { requireOrganizationId } from "@/lib/scoping";
import { getRequiredSession } from "@/lib/session";

function parseDate(value: FormDataEntryValue | null, label: string) {
  const raw = String(value ?? "");
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (!raw || Number.isNaN(date.getTime())) throw new Error(`${label} is required.`);
  return date;
}

function idList(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((value) => String(value))
    .filter(Boolean);
}

export async function createCampaignAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const organizationId = requireOrganizationId(session);
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) throw new Error("Enter a campaign name.");
  const startDate = parseDate(formData.get("startDate"), "Start date");
  const endDate = parseDate(formData.get("endDate"), "End date");
  if (endDate < startDate) throw new Error("The end date must be on or after the start date.");

  const campaign = await db.verificationCampaign.create({
    data: {
      organizationId,
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      startDate,
      endDate,
      branchIds: idList(formData, "branchIds"),
      departmentIds: idList(formData, "departmentIds"),
      categoryIds: idList(formData, "categoryIds"),
      createdById: session.userId,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId,
    action: "campaign.create",
    entityType: "VerificationCampaign",
    entityId: campaign.id,
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaignAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const organizationId = requireOrganizationId(session);
  const campaignId = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaignForOrg(campaignId, organizationId);
  if (!campaign) throw new Error("Campaign not found.");
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT) throw new Error("Only a draft campaign can be edited.");

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) throw new Error("Enter a campaign name.");
  const startDate = parseDate(formData.get("startDate"), "Start date");
  const endDate = parseDate(formData.get("endDate"), "End date");
  if (endDate < startDate) throw new Error("The end date must be on or after the start date.");

  await db.verificationCampaign.update({
    where: { id: campaignId },
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      startDate,
      endDate,
      branchIds: idList(formData, "branchIds"),
      departmentIds: idList(formData, "departmentIds"),
      categoryIds: idList(formData, "categoryIds"),
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId,
    action: "campaign.update",
    entityType: "VerificationCampaign",
    entityId: campaignId,
  });
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function assignOfficerAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const organizationId = requireOrganizationId(session);
  const campaignId = String(formData.get("campaignId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const branchId = String(formData.get("branchId") ?? "") || null;
  const campaign = await getCampaignForOrg(campaignId, organizationId);
  if (!campaign) throw new Error("Campaign not found.");
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT) throw new Error("Officers can only be assigned while the campaign is a draft.");

  const user = await db.user.findFirst({ where: { id: userId, organizationId }, select: { id: true } });
  if (!user) throw new Error("Officer not found.");
  if (branchId) {
    const branch = await db.branch.findFirst({ where: { id: branchId, organizationId }, select: { id: true } });
    if (!branch) throw new Error("Branch not found.");
  }

  const duplicate = await db.campaignAssignment.findFirst({
    where: { campaignId, userId, branchId },
  });
  if (duplicate) throw new Error("That officer is already assigned.");

  await db.campaignAssignment.create({ data: { campaignId, userId, branchId } });
  await writeAuditLog({
    actorUserId: session.userId,
    organizationId,
    action: "campaign.assign",
    entityType: "VerificationCampaign",
    entityId: campaignId,
    metadata: { userId, branchId },
  });
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function removeOfficerAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const organizationId = requireOrganizationId(session);
  const campaignId = String(formData.get("campaignId") ?? "");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const campaign = await getCampaignForOrg(campaignId, organizationId);
  if (!campaign || campaign.status !== CAMPAIGN_STATUS.DRAFT) throw new Error("Officers can only be changed while the campaign is a draft.");

  await db.campaignAssignment.deleteMany({ where: { id: assignmentId, campaignId } });
  await writeAuditLog({
    actorUserId: session.userId,
    organizationId,
    action: "campaign.unassign",
    entityType: "VerificationCampaign",
    entityId: campaignId,
    metadata: { assignmentId },
  });
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function activateCampaignAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const campaignId = String(formData.get("campaignId") ?? "");
  await activateCampaign(campaignId, session);
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function changeCampaignStatusAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const campaignId = String(formData.get("campaignId") ?? "");
  const status = String(formData.get("status") ?? "") as CampaignStatus;
  await changeCampaignStatus(campaignId, session, status);
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function verifyAssetAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const campaignId = String(formData.get("campaignId") ?? "");
  const outcome = String(formData.get("outcome") ?? "") as VerificationOutcome;
  const allowed = new Set<string>(Object.values(VERIFICATION_OUTCOME));
  if (!allowed.has(outcome)) throw new Error("Choose a verification outcome.");

  const assetId = String(formData.get("assetId") ?? "") || null;
  let photoUrl: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0 && assetId) {
    const uploaded = await uploadAssetFileToSpaces(assetId, photo, "photos");
    photoUrl = uploaded.publicUrl;
  }

  await recordVerification({
    campaignId,
    session,
    outcome,
    assetId,
    exceptionType: String(formData.get("exceptionType") ?? "") || null,
    locationNote: String(formData.get("locationNote") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    unregisteredLabel: String(formData.get("unregisteredLabel") ?? ""),
    notFoundReason: String(formData.get("notFoundReason") ?? "") || null,
    lastKnownLocation: String(formData.get("lastKnownLocation") ?? ""),
    photoUrl,
    unregisteredAsset:
      outcome === VERIFICATION_OUTCOME.UNREGISTERED
        ? {
            ain: String(formData.get("ain") ?? "").trim().toUpperCase(),
            serialNumber: String(formData.get("serialNumber") ?? "").trim(),
            name: String(formData.get("name") ?? "").trim(),
            branchId: String(formData.get("branchId") ?? ""),
            categoryId: String(formData.get("categoryId") ?? ""),
            manufacturer: String(formData.get("manufacturer") ?? ""),
            modelName: String(formData.get("modelName") ?? ""),
            existingAssetNumber: String(formData.get("existingAssetNumber") ?? ""),
          }
        : null,
  });

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/exceptions");
  revalidatePath("/dashboard");
}
