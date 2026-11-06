import { PageHeader } from "@/components/shared/page-header";
import { OverviewGrid } from "@/components/dashboard/overview-grid";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { PortfolioFilters } from "@/components/dashboard/portfolio-filters";
import { db } from "@/lib/db";
import { ASSET_CONDITION, ASSET_STATUS, ENUM_LABELS, RECOMMENDATION_STATE, USER_ROLES } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { snapshotCurrentQuarter } from "@/lib/budget-service";
import { countOpenExceptions } from "@/lib/exception-service";
import { attentionCounts } from "@/lib/attention";
import { getOptionalQuery, type SearchParams } from "@/lib/filters/query";
import { getReferenceDataForSession } from "@/lib/reference-data";
import { Prisma } from "@/lib/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const assetScope = getAssetScopeWhere(session);
  const now = new Date();
  const warrantyDueThreshold = new Date();
  warrantyDueThreshold.setDate(warrantyDueThreshold.getDate() + 90);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearEnd = new Date(new Date().getFullYear() + 1, 0, 1);
  const region = getOptionalQuery(params, "region");
  const branch = getOptionalQuery(params, "branch");
  const department = getOptionalQuery(params, "department");
  const category = getOptionalQuery(params, "category");
  const custodian = getOptionalQuery(params, "custodian");
  const condition = getOptionalQuery(params, "condition");
  const status = getOptionalQuery(params, "status");
  const year = getOptionalQuery(params, "year");
  const portfolioWhere: Prisma.AssetWhereInput = {
    ...assetScope,
    ...(region ? { branch: { regionId: region } } : {}),
    ...(branch ? { branchId: branch } : {}),
    ...(department ? { departmentId: department } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(custodian ? { custodianId: custodian } : {}),
    ...(condition && Object.values(ASSET_CONDITION).includes(condition as never) ? { condition: condition as never } : {}),
    ...(status && Object.values(ASSET_STATUS).includes(status as never) ? { status: status as never } : {}),
    ...(year && /^\d{4}$/.test(year)
      ? {
          purchaseDate: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lt: new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`),
          },
        }
      : {}),
  };

  const organization = session.organizationId
    ? await db.organization.findUnique({
        where: { id: session.organizationId },
        select: { name: true, maintenanceCostThresholdPercent: true },
      })
    : null;

  const [totalAssets, warrantyExpiringSoon, replacementDueQuarter, yearlyBudget, statusGroups, regionGroups, quarterSnapshot, openExceptions, attention, refs, years] =
    await Promise.all([
      db.asset.count({ where: assetScope }),
      db.asset.count({
        where: { ...assetScope, isActive: true, warrantyExpiryDate: { gte: now, lte: warrantyDueThreshold } },
      }),
      db.replacementEvaluation.count({
        where: {
          asset: assetScope,
          state: { in: [RECOMMENDATION_STATE.APPROACHING, RECOMMENDATION_STATE.OVERDUE] },
        },
      }),
      db.replacementEvaluation.aggregate({
        _sum: { estimatedReplacementCost: true },
        where: { asset: assetScope, recommendedReplaceDate: { gte: yearStart, lt: yearEnd } },
      }),
      db.asset.groupBy({ by: ["status"], where: portfolioWhere, _count: { _all: true } }),
      db.asset.groupBy({ by: ["branchId"], where: portfolioWhere, _count: { _all: true } }),
      session.organizationId
        ? snapshotCurrentQuarter(session.organizationId, session.role === USER_ROLES.ADMIN ? null : session.branchId)
        : Promise.resolve(null),
      session.organizationId ? countOpenExceptions(session.organizationId) : Promise.resolve(0),
      session.organizationId
        ? attentionCounts(session.organizationId, assetScope, organization?.maintenanceCostThresholdPercent ?? 50)
        : Promise.resolve(null),
      getReferenceDataForSession(session),
      db.asset.findMany({ where: assetScope, select: { purchaseDate: true }, take: 500 }),
    ]);

  const branchIds = [...new Set(regionGroups.map((item) => item.branchId))];
  const branches = branchIds.length
    ? await db.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, region: { select: { name: true } } },
      })
    : [];
  const regionCounts = new Map<string, number>();
  for (const row of regionGroups) {
    const name = branches.find((item) => item.id === row.branchId)?.region.name ?? "Unknown";
    regionCounts.set(name, (regionCounts.get(name) ?? 0) + row._count._all);
  }
  const statusCount = (value: string) => statusGroups.find((row) => row.status === value)?._count._all ?? 0;
  const portfolioBreakdown = [
    ["In use", statusCount(ASSET_STATUS.ACTIVE)],
    ["Storage", statusCount(ASSET_STATUS.IN_STORAGE)],
    ["Under repair", statusCount(ASSET_STATUS.UNDER_REPAIR)],
    ["Pending disposal", statusCount(ASSET_STATUS.PENDING_DISPOSAL)],
  ] as const;
  const yearOptions = [...new Set(years.map((row) => String(row.purchaseDate.getUTCFullYear())))].sort();
  const emptyAttention = {
    missing: 0,
    unverified: 0,
    damaged: 0,
    warrantyExpired: 0,
    warrantySoon: 0,
    highMaintenance: 0,
    underRepair: 0,
    beyondUsefulLife: 0,
    pendingDisposal: 0,
    unresolvedExceptions: 0,
  };

  return (
    <div className="min-w-0">
      <PageHeader title={organization?.name ?? "Dashboard"} description="Role-scoped visibility of asset health, replacement risk, and budget impact." />
      <OverviewGrid
        totalAssets={totalAssets}
        warrantyExpiringSoon={warrantyExpiringSoon}
        replacementDueQuarter={replacementDueQuarter}
        estimatedBudgetGhs={Number(yearlyBudget._sum.estimatedReplacementCost ?? 0)}
        quarterSnapshotDue={quarterSnapshot?.totalAssetsDue ?? null}
        quarterSnapshotCost={quarterSnapshot ? Number(quarterSnapshot.estimatedTotalCost) : null}
        openExceptions={openExceptions}
        attention={attention ?? emptyAttention}
      />
      <div className="mt-6">
        <PortfolioFilters
          regions={refs.regions}
          branches={refs.branches}
          departments={refs.departments.map((item) => ({ id: item.id, label: item.name }))}
          categories={refs.categories}
          custodians={refs.custodians}
          years={yearOptions}
        />
        <div className="mb-4 grid min-w-0 gap-3 md:grid-cols-2">
          <Card className="border-navy-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By region</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-navy-900">
              {[...regionCounts.entries()].map(([name, count]) => (
                <p key={name} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">{name}</span>
                  <span className="shrink-0 tabular-nums">{count}</span>
                </p>
              ))}
            </CardContent>
          </Card>
          <Card className="border-navy-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-navy-900">
              {portfolioBreakdown.map(([label, count]) => (
                <p key={label} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">{label}</span>
                  <span className="shrink-0 tabular-nums">{count}</span>
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
        <AnalyticsCharts
          statusData={statusGroups.map((item) => ({
            name: ENUM_LABELS.assetStatus[item.status] ?? item.status,
            count: item._count._all,
          }))}
          branchData={[...regionCounts.entries()].map(([name, count]) => ({ name, count }))}
        />
      </div>
    </div>
  );
}
