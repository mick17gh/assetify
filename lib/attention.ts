import { ASSET_CONDITION, ASSET_STATUS, CAMPAIGN_STATUS, RECOMMENDATION_STATE } from "@/constants";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export const HIGH_MAINTENANCE_FLAG_TITLE = "High maintenance cost — review for replacement";

const ACTIVE_REGISTER: Prisma.AssetWhereInput = { isActive: true };

export async function unverifiedActiveCampaignAssetIds(organizationId: string, scope: Prisma.AssetWhereInput) {
  const [snapshots, verifications] = await Promise.all([
    db.campaignScopeSnapshot.findMany({
      where: { campaign: { organizationId, status: CAMPAIGN_STATUS.ACTIVE }, asset: scope },
      select: { campaignId: true, assetId: true },
    }),
    db.assetVerification.findMany({
      where: { organizationId, campaign: { status: CAMPAIGN_STATUS.ACTIVE }, assetId: { not: null } },
      select: { campaignId: true, assetId: true },
    }),
  ]);
  const verified = new Set(verifications.map((row) => `${row.campaignId}:${row.assetId}`));
  return [...new Set(snapshots.filter((row) => !verified.has(`${row.campaignId}:${row.assetId}`)).map((row) => row.assetId))];
}

export async function attentionCounts(organizationId: string, scope: Prisma.AssetWhereInput, thresholdPercent: number) {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 90);
  const unverifiedIds = await unverifiedActiveCampaignAssetIds(organizationId, scope);
  const base = { ...scope, ...ACTIVE_REGISTER };

  const [
    missing,
    damaged,
    warrantyExpired,
    warrantySoon,
    highMaintenance,
    underRepair,
    beyondUsefulLife,
    pendingDisposal,
    unresolvedExceptions,
  ] = await Promise.all([
    db.asset.count({ where: { ...base, status: ASSET_STATUS.MISSING } }),
    db.asset.count({ where: { ...base, condition: ASSET_CONDITION.DAMAGED } }),
    db.asset.count({ where: { ...base, warrantyExpiryDate: { lt: now } } }),
    db.asset.count({ where: { ...base, warrantyExpiryDate: { gte: now, lte: soon } } }),
    db.asset.count({
      where: { ...base, conditionFlags: { some: { title: HIGH_MAINTENANCE_FLAG_TITLE, resolvedAt: null } } },
    }),
    db.asset.count({ where: { ...base, status: ASSET_STATUS.UNDER_REPAIR } }),
    db.asset.count({
      where: {
        ...base,
        replacementEvaluations: { some: { state: RECOMMENDATION_STATE.OVERDUE } },
      },
    }),
    db.asset.count({ where: { ...base, status: ASSET_STATUS.PENDING_DISPOSAL } }),
    db.assetException.count({
      where: {
        organizationId,
        status: { in: ["IDENTIFIED", "ASSIGNED", "INVESTIGATING"] },
      },
    }),
  ]);

  return {
    missing,
    unverified: unverifiedIds.length,
    damaged,
    warrantyExpired,
    warrantySoon,
    highMaintenance,
    underRepair,
    beyondUsefulLife,
    pendingDisposal,
    unresolvedExceptions,
    thresholdPercent,
  };
}

export async function attentionAssetWhere(
  key: string,
  organizationId: string,
  scope: Prisma.AssetWhereInput,
): Promise<Prisma.AssetWhereInput | null> {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 90);
  const base = { ...scope, ...ACTIVE_REGISTER };
  if (key === "missing") return { ...base, status: ASSET_STATUS.MISSING };
  if (key === "damaged") return { ...base, condition: ASSET_CONDITION.DAMAGED };
  if (key === "warranty-expired") return { ...base, warrantyExpiryDate: { lt: now } };
  if (key === "warranty-soon") return { ...base, warrantyExpiryDate: { gte: now, lte: soon } };
  if (key === "high-maintenance") {
    return { ...base, conditionFlags: { some: { title: HIGH_MAINTENANCE_FLAG_TITLE, resolvedAt: null } } };
  }
  if (key === "under-repair") return { ...base, status: ASSET_STATUS.UNDER_REPAIR };
  if (key === "beyond-life") {
    return { ...base, replacementEvaluations: { some: { state: RECOMMENDATION_STATE.OVERDUE } } };
  }
  if (key === "pending-disposal") return { ...base, status: ASSET_STATUS.PENDING_DISPOSAL };
  if (key === "unverified") {
    const ids = await unverifiedActiveCampaignAssetIds(organizationId, scope);
    return { ...base, id: { in: ids.length ? ids : ["__none__"] } };
  }
  return null;
}
