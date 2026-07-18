import { PageHeader } from "@/components/shared/page-header";
import { OverviewGrid } from "@/components/dashboard/overview-grid";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { db } from "@/lib/db";
import { RECOMMENDATION_STATE, USER_ROLES } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { snapshotCurrentQuarter } from "@/lib/budget-service";

export default async function DashboardPage() {
  const session = await getRequiredSession();
  const assetScope = getAssetScopeWhere(session);
  const warrantyDueThreshold = new Date();
  warrantyDueThreshold.setDate(warrantyDueThreshold.getDate() + 90);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearEnd = new Date(new Date().getFullYear() + 1, 0, 1);

  const [totalAssets, warrantyExpiringSoon, replacementDueQuarter, yearlyBudget, statusGroups, branchGroups, quarterSnapshot] =
    await Promise.all([
      db.asset.count({ where: assetScope }),
      db.asset.count({
        where: {
          ...assetScope,
          warrantyExpiryDate: {
            lte: warrantyDueThreshold,
          },
        },
      }),
      db.replacementEvaluation.count({
        where: {
          asset: assetScope,
          state: { in: [RECOMMENDATION_STATE.APPROACHING, RECOMMENDATION_STATE.OVERDUE] },
        },
      }),
      db.replacementEvaluation.aggregate({
        _sum: { estimatedReplacementCost: true },
        where: {
          asset: assetScope,
          recommendedReplaceDate: {
            gte: yearStart,
            lt: yearEnd,
          },
        },
      }),
      db.asset.groupBy({
        by: ["status"],
        where: assetScope,
        _count: { _all: true },
      }),
      db.asset.groupBy({
        by: ["branchId"],
        where: assetScope,
        _count: { _all: true },
      }),
      session.organizationId
        ? snapshotCurrentQuarter(
            session.organizationId,
            session.role === USER_ROLES.ADMIN ? null : session.branchId,
          )
        : Promise.resolve(null),
    ]);

  const topBranchGroups = [...branchGroups].sort((a, b) => b._count._all - a._count._all).slice(0, 6);
  const branchIds = topBranchGroups.map((item) => item.branchId);
  const branches = branchIds.length
    ? await db.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true },
      })
    : [];
  const branchMap = new Map(branches.map((branch) => [branch.id, branch.name]));

  return (
    <div>
      <PageHeader
        title="Branch Dashboard"
        description="Role-scoped visibility of asset health, replacement risk, and budget impact."
      />
      <OverviewGrid
        totalAssets={totalAssets}
        warrantyExpiringSoon={warrantyExpiringSoon}
        replacementDueQuarter={replacementDueQuarter}
        estimatedBudgetGhs={Number(yearlyBudget._sum.estimatedReplacementCost ?? 0)}
        quarterSnapshotDue={quarterSnapshot?.totalAssetsDue ?? null}
        quarterSnapshotCost={quarterSnapshot ? Number(quarterSnapshot.estimatedTotalCost) : null}
      />
      <AnalyticsCharts
        statusData={statusGroups.map((item) => ({ name: item.status, count: item._count._all }))}
        branchData={topBranchGroups.map((item) => ({
          name: branchMap.get(item.branchId) ?? "Unknown",
          count: item._count._all,
        }))}
      />
    </div>
  );
}
