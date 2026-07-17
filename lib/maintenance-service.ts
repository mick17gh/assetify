import { db } from "@/lib/db";

export async function getTotalMaintenanceCost(assetId: string): Promise<number> {
  const result = await db.maintenanceRecord.aggregate({
    where: { assetId },
    _sum: { cost: true },
  });
  return Number(result._sum.cost ?? 0);
}

export function isHighMaintenanceAsset(
  purchaseCost: number,
  totalMaintenanceCost: number,
  thresholdPercent: number,
): boolean {
  if (purchaseCost <= 0) return false;
  return totalMaintenanceCost >= purchaseCost * (thresholdPercent / 100);
}

const HIGH_MAINTENANCE_FLAG_TITLE = "High maintenance cost — review for replacement";

export async function ensureHighMaintenanceFlag(
  assetId: string,
  purchaseCost: number,
  thresholdPercent: number,
): Promise<void> {
  const totalCost = await getTotalMaintenanceCost(assetId);
  if (!isHighMaintenanceAsset(purchaseCost, totalCost, thresholdPercent)) return;

  const existing = await db.conditionFlag.findFirst({
    where: {
      assetId,
      title: HIGH_MAINTENANCE_FLAG_TITLE,
      resolvedAt: null,
    },
    select: { id: true },
  });
  if (existing) return;

  await db.conditionFlag.create({
    data: {
      assetId,
      title: HIGH_MAINTENANCE_FLAG_TITLE,
      severity: "HIGH",
    },
  });
}
