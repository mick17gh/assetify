import { ASSET_CONDITION, ASSET_STATUS, CAMPAIGN_STATUS, EXCEPTION_TYPE, NOT_FOUND_REASON, VERIFICATION_OUTCOME } from "@/constants";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { openException } from "@/lib/exception-service";
import {
  Prisma,
  type CampaignStatus,
  type ExceptionType,
  type VerificationOutcome,
} from "@/lib/generated/prisma/client";
import type { AppSession } from "@/lib/session";

const ACTIVE_ASSET = { isActive: true, status: ASSET_STATUS.ACTIVE } as const;

export type CampaignStats = {
  expected: number;
  verified: number;
  notFound: number;
  unregistered: number;
  exceptions: number;
  completionPercent: number;
};

function scopeWhere(campaign: {
  organizationId: string;
  branchIds: string[];
  departmentIds: string[];
  categoryIds: string[];
}): Prisma.AssetWhereInput {
  const where: Prisma.AssetWhereInput = {
    organizationId: campaign.organizationId,
    ...ACTIVE_ASSET,
  };
  if (campaign.branchIds.length) where.branchId = { in: campaign.branchIds };
  if (campaign.departmentIds.length) where.departmentId = { in: campaign.departmentIds };
  if (campaign.categoryIds.length) where.categoryId = { in: campaign.categoryIds };
  return where;
}

export async function getCampaignForOrg(campaignId: string, organizationId: string) {
  return db.verificationCampaign.findFirst({
    where: { id: campaignId, organizationId },
  });
}

export async function activateCampaign(campaignId: string, session: AppSession) {
  const organizationId = session.organizationId;
  if (!organizationId) throw new Error("Your account is not linked to an organization.");

  const campaign = await getCampaignForOrg(campaignId, organizationId);
  if (!campaign) throw new Error("Campaign not found.");
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT) throw new Error("Only a draft campaign can be activated.");

  const officers = await db.campaignAssignment.count({ where: { campaignId } });
  if (officers < 1) throw new Error("Assign at least one officer before activating.");

  const assets = await db.asset.findMany({
    where: scopeWhere(campaign),
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    if (assets.length) {
      await tx.campaignScopeSnapshot.createMany({
        data: assets.map((asset) => ({ campaignId, assetId: asset.id })),
        skipDuplicates: true,
      });
    }
    await tx.verificationCampaign.update({
      where: { id: campaignId },
      data: { status: CAMPAIGN_STATUS.ACTIVE },
    });
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId,
    action: "campaign.activate",
    entityType: "VerificationCampaign",
    entityId: campaignId,
    metadata: { expected: assets.length },
  });

  return assets.length;
}

export async function getCampaignStats(campaignId: string, organizationId: string): Promise<CampaignStats> {
  const campaign = await getCampaignForOrg(campaignId, organizationId);
  if (!campaign) throw new Error("Campaign not found.");

  const [expected, grouped] = await Promise.all([
    db.campaignScopeSnapshot.count({ where: { campaignId } }),
    db.assetVerification.groupBy({
      by: ["outcome"],
      where: { campaignId, organizationId },
      _count: { _all: true },
    }),
  ]);

  const count = (outcome: VerificationOutcome) => grouped.find((row) => row.outcome === outcome)?._count._all ?? 0;
  const verified = count(VERIFICATION_OUTCOME.VERIFIED);
  const notFound = count(VERIFICATION_OUTCOME.NOT_FOUND);
  const unregistered = count(VERIFICATION_OUTCOME.UNREGISTERED);
  const exceptions = count(VERIFICATION_OUTCOME.EXCEPTION);
  const completionPercent = expected === 0 ? 0 : Math.round((verified / expected) * 100);

  return { expected, verified, notFound, unregistered, exceptions, completionPercent };
}

async function assertAssignedOfficer(campaignId: string, userId: string, assetBranchId: string | null) {
  const rows = await db.campaignAssignment.findMany({ where: { campaignId, userId } });
  const allowed = rows.some((row) => row.branchId == null || row.branchId === assetBranchId);
  if (!allowed) throw new Error("You are not assigned to verify this asset.");
}

function exceptionTypeForOutcome(outcome: VerificationOutcome, requested?: string | null): ExceptionType | null {
  if (outcome === VERIFICATION_OUTCOME.VERIFIED) return null;
  if (outcome === VERIFICATION_OUTCOME.NOT_FOUND) return EXCEPTION_TYPE.MISSING;
  if (outcome === VERIFICATION_OUTCOME.UNREGISTERED) return EXCEPTION_TYPE.UNREGISTERED;
  const allowed = new Set<string>(Object.values(EXCEPTION_TYPE));
  if (!requested || !allowed.has(requested)) {
    throw new Error("Choose an exception type.");
  }
  return requested as ExceptionType;
}

export async function recordVerification(input: {
  campaignId: string;
  session: AppSession;
  outcome: VerificationOutcome;
  assetId?: string | null;
  exceptionType?: string | null;
  locationNote?: string | null;
  notes?: string | null;
  unregisteredLabel?: string | null;
  notFoundReason?: string | null;
  lastKnownLocation?: string | null;
  photoUrl?: string | null;
  unregisteredAsset?: {
    ain: string;
    serialNumber: string;
    name: string;
    branchId: string;
    categoryId: string;
    manufacturer?: string | null;
    modelName?: string | null;
    existingAssetNumber?: string | null;
  } | null;
}) {
  const organizationId = input.session.organizationId;
  if (!organizationId) throw new Error("Your account is not linked to an organization.");

  const campaign = await getCampaignForOrg(input.campaignId, organizationId);
  if (!campaign) throw new Error("Campaign not found.");
  if (campaign.status !== CAMPAIGN_STATUS.ACTIVE) throw new Error("This campaign is not active.");

  const outcome = input.outcome;
  let assetId = input.assetId ?? null;
  let branchId: string | null = null;

  if (outcome === VERIFICATION_OUTCOME.UNREGISTERED) {
    const draft = input.unregisteredAsset;
    if (!draft?.ain || !draft.serialNumber || !draft.name || !draft.branchId || !draft.categoryId) {
      throw new Error("Enter the asset details for the unregistered find.");
    }
    const branch = await db.branch.findFirst({
      where: { id: draft.branchId, organizationId },
      select: { id: true },
    });
    if (!branch) throw new Error("Branch not found.");
    const category = await db.category.findFirst({ where: { id: draft.categoryId }, select: { id: true } });
    if (!category) throw new Error("Category not found.");
    const duplicate = await db.asset.findFirst({
      where: { organizationId, ain: draft.ain },
      select: { id: true },
    });
    if (duplicate) throw new Error("That AIN is already in the register.");
    await assertAssignedOfficer(campaign.id, input.session.userId, branch.id);
    branchId = branch.id;
    assetId = null;
  } else {
    if (!assetId) throw new Error("Choose an asset.");
    const asset = await db.asset.findFirst({
      where: { id: assetId, organizationId },
      select: { id: true, branchId: true },
    });
    if (!asset) throw new Error("Asset not found.");
    branchId = asset.branchId;

    const inSnapshot = await db.campaignScopeSnapshot.findUnique({
      where: { campaignId_assetId: { campaignId: campaign.id, assetId } },
      select: { id: true },
    });
    if (!inSnapshot) throw new Error("This asset is outside the campaign.");

    await assertAssignedOfficer(campaign.id, input.session.userId, asset.branchId);

    const already = await db.assetVerification.findFirst({
      where: { campaignId: campaign.id, assetId },
      select: { id: true },
    });
    if (already) throw new Error("This asset was already verified in this campaign.");
  }

  if (outcome === VERIFICATION_OUTCOME.NOT_FOUND) {
    const reason = input.notFoundReason ?? "";
    const allowedReasons = new Set<string>(Object.values(NOT_FOUND_REASON));
    if (!allowedReasons.has(reason)) throw new Error("A not-found reason is required.");
    if (reason === NOT_FOUND_REASON.OTHER && !input.notes?.trim()) {
      throw new Error("Other requires a note.");
    }
  }

  const exceptionType = exceptionTypeForOutcome(outcome, input.exceptionType);
  const description =
    input.notes?.trim() ||
    input.unregisteredLabel?.trim() ||
    (outcome === VERIFICATION_OUTCOME.NOT_FOUND
      ? "Asset was not found during verification."
      : outcome === VERIFICATION_OUTCOME.UNREGISTERED
        ? "Unregistered asset found during verification."
        : "Exception recorded during verification.");

  const created = await db.$transaction(async (tx) => {
    if (outcome === VERIFICATION_OUTCOME.UNREGISTERED && input.unregisteredAsset) {
      const draft = input.unregisteredAsset;
      const asset = await tx.asset.create({
        data: {
          ain: draft.ain,
          serialNumber: draft.serialNumber,
          name: draft.name,
          manufacturer: draft.manufacturer || null,
          modelName: draft.modelName || null,
          existingAssetNumber: draft.existingAssetNumber || null,
          purchaseDate: new Date(),
          purchaseCost: "0.00",
          status: ASSET_STATUS.ACTIVE,
          condition: ASSET_CONDITION.UNKNOWN,
          branchId: draft.branchId,
          categoryId: draft.categoryId,
          organizationId,
        },
      });
      assetId = asset.id;
    }

    const verification = await tx.assetVerification.create({
      data: {
        campaignId: campaign.id,
        assetId,
        organizationId,
        outcome,
        verifiedById: input.session.userId,
        locationNote: input.locationNote?.trim() || null,
        notes: input.notes?.trim() || input.unregisteredLabel?.trim() || null,
        notFoundReason: outcome === VERIFICATION_OUTCOME.NOT_FOUND ? (input.notFoundReason as never) : null,
        lastKnownLocation: input.lastKnownLocation?.trim() || null,
        photoUrl: input.photoUrl || null,
      },
    });

    let exceptionId: string | null = null;
    if (exceptionType) {
      const opened = await openException(
        {
          organizationId,
          campaignId: campaign.id,
          assetId,
          branchId,
          type: exceptionType,
          description,
          identifiedById: input.session.userId,
          audit: false,
        },
        tx,
      );
      exceptionId = opened.id;
    }

    return { verificationId: verification.id, exceptionId };
  });

  await writeAuditLog({
    actorUserId: input.session.userId,
    organizationId,
    branchId,
    action: "campaign.verify",
    entityType: "AssetVerification",
    entityId: created.verificationId,
    metadata: { campaignId: campaign.id, outcome, assetId, exceptionId: created.exceptionId },
  });

  if (created.exceptionId) {
    await writeAuditLog({
      actorUserId: input.session.userId,
      organizationId,
      branchId,
      action: "exception.open",
      entityType: "AssetException",
      entityId: created.exceptionId,
      metadata: { type: exceptionType, campaignId: campaign.id, assetId },
    });
  }

  return created;
}

export async function listScanPrompts(session: AppSession, assetId: string) {
  if (!session.organizationId) return [];
  const asset = await db.asset.findFirst({
    where: { id: assetId, organizationId: session.organizationId },
    select: { branchId: true },
  });
  if (!asset) return [];

  return db.verificationCampaign.findMany({
    where: {
      organizationId: session.organizationId,
      status: CAMPAIGN_STATUS.ACTIVE,
      snapshots: { some: { assetId } },
      verifications: { none: { assetId } },
      assignments: {
        some: {
          userId: session.userId,
          OR: [{ branchId: null }, { branchId: asset.branchId }],
        },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function progressByBranch(campaignId: string, organizationId: string) {
  const campaign = await getCampaignForOrg(campaignId, organizationId);
  if (!campaign) throw new Error("Campaign not found.");

  const snapshots = await db.campaignScopeSnapshot.findMany({
    where: { campaignId },
    select: {
      assetId: true,
      asset: { select: { branchId: true, branch: { select: { name: true } } } },
    },
  });
  const verifications = await db.assetVerification.findMany({
    where: { campaignId, assetId: { not: null } },
    select: { assetId: true, outcome: true },
  });
  const byAsset = new Map(verifications.map((row) => [row.assetId, row.outcome]));

  const groups = new Map<string, { branch: string; expected: number; verified: number; notFound: number; exceptions: number }>();
  for (const row of snapshots) {
    const key = row.asset.branchId;
    const current = groups.get(key) ?? {
      branch: row.asset.branch.name,
      expected: 0,
      verified: 0,
      notFound: 0,
      exceptions: 0,
    };
    current.expected += 1;
    const outcome = byAsset.get(row.assetId);
    if (outcome === VERIFICATION_OUTCOME.VERIFIED) current.verified += 1;
    if (outcome === VERIFICATION_OUTCOME.NOT_FOUND) current.notFound += 1;
    if (outcome === VERIFICATION_OUTCOME.EXCEPTION) current.exceptions += 1;
    groups.set(key, current);
  }

  return [...groups.values()].sort((a, b) => a.branch.localeCompare(b.branch));
}

export async function campaignExportRows(campaignId: string, organizationId: string) {
  const [stats, campaign, pendingInvestigation, exceptionGroups, branchTotals] = await Promise.all([
    getCampaignStats(campaignId, organizationId),
    db.verificationCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: { organization: { select: { name: true } } },
    }),
    db.assetException.count({
      where: {
        campaignId,
        organizationId,
        status: { in: ["IDENTIFIED", "ASSIGNED", "INVESTIGATING"] },
      },
    }),
    db.assetException.groupBy({
      by: ["type"],
      where: { campaignId, organizationId },
      _count: { _all: true },
    }),
    progressByBranch(campaignId, organizationId),
  ]);
  if (!campaign) throw new Error("Campaign not found.");
  const rows = await db.assetVerification.findMany({
    where: { campaignId, organizationId },
    include: {
      asset: { select: { ain: true, name: true, branch: { select: { name: true } } } },
      verifiedBy: { select: { name: true } },
    },
    orderBy: { verifiedAt: "asc" },
  });

  const report = {
    clientName: campaign.organization.name,
    period: `${campaign.startDate.toISOString().slice(0, 10)} to ${campaign.endDate.toISOString().slice(0, 10)}`,
    ...stats,
    pendingInvestigation,
    byBranch: branchTotals.map((row) => ({ branch: row.branch, expected: row.expected, verified: row.verified })),
    byExceptionType: exceptionGroups.map((row) => ({ type: row.type, count: row._count._all })),
  };

  return {
    stats,
    report,
    rows: rows.map((row) => ({
      asset: row.asset ? `${row.asset.ain} ${row.asset.name}` : "Unregistered",
      branch: row.asset?.branch.name ?? "",
      outcome: row.outcome,
      officer: row.verifiedBy.name,
      verifiedAt: row.verifiedAt.toISOString(),
      notes: row.notes ?? "",
    })),
  };
}

const STATUS_MOVES: Partial<Record<CampaignStatus, CampaignStatus[]>> = {
  ACTIVE: [CAMPAIGN_STATUS.PAUSED, CAMPAIGN_STATUS.COMPLETED, CAMPAIGN_STATUS.CANCELLED],
  PAUSED: [CAMPAIGN_STATUS.ACTIVE, CAMPAIGN_STATUS.CANCELLED],
};

export async function changeCampaignStatus(campaignId: string, session: AppSession, next: CampaignStatus) {
  const organizationId = session.organizationId;
  if (!organizationId) throw new Error("Your account is not linked to an organization.");
  const campaign = await getCampaignForOrg(campaignId, organizationId);
  if (!campaign) throw new Error("Campaign not found.");
  const allowed = STATUS_MOVES[campaign.status] ?? [];
  if (!allowed.includes(next)) throw new Error("That status change is not allowed.");

  await db.verificationCampaign.update({ where: { id: campaignId }, data: { status: next } });
  await writeAuditLog({
    actorUserId: session.userId,
    organizationId,
    action: "campaign.status",
    entityType: "VerificationCampaign",
    entityId: campaignId,
    metadata: { from: campaign.status, to: next },
  });
}
