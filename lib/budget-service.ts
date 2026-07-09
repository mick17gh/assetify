import { db } from "@/lib/db";
import { RECOMMENDATION_STATE } from "@/constants";

export async function snapshotBudgetForPeriod(
  organizationId: string,
  branchId: string | null,
  periodStart: Date,
  periodEnd: Date,
) {
  const evaluations = await db.replacementEvaluation.findMany({
    where: {
      state: { in: [RECOMMENDATION_STATE.APPROACHING, RECOMMENDATION_STATE.OVERDUE] },
      recommendedReplaceDate: { gte: periodStart, lte: periodEnd },
      asset: {
        organizationId,
        ...(branchId ? { branchId } : {}),
      },
    },
    include: { asset: true },
  });

  const totalAssetsDue = evaluations.length;
  const estimatedTotalCost = evaluations.reduce(
    (sum, row) => sum + Number(row.estimatedReplacementCost),
    0,
  );

  await db.budgetForecastSnapshot.create({
    data: {
      organizationId,
      branchId,
      periodStart,
      periodEnd,
      totalAssetsDue,
      estimatedTotalCost,
    },
  });

  return { totalAssetsDue, estimatedTotalCost };
}

export async function snapshotCurrentQuarter(organizationId: string, branchId: string | null) {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const periodStart = new Date(now.getFullYear(), quarter * 3, 1);
  const periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  return snapshotBudgetForPeriod(organizationId, branchId, periodStart, periodEnd);
}
