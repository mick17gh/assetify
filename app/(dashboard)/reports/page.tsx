import { Suspense } from "react";
import { ReportCenter } from "@/components/reports/report-center";
import { ReportCharts } from "@/components/reports/report-charts";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";
import { RecommendationStateFilter } from "@/components/shared/recommendation-state-filter";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/page-loading";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { db } from "@/lib/db";
import { PERMISSION_KEYS, RECOMMENDATION_STATE } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { hasPermission } from "@/lib/permissions";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  getDepartmentCostReport,
  getDisposalSummaryReport,
  getEndOfLifeValuationPage,
  getReplacementCostTrend,
} from "@/lib/reports";

function buildWhereBase(
  session: Awaited<ReturnType<typeof getRequiredSession>>,
  q: string | undefined,
  stateQuery: string | undefined,
): Prisma.ReplacementEvaluationWhereInput {
  return {
    asset: {
      ...getAssetScopeWhere(session),
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { ain: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    ...(stateQuery ? { state: stateQuery as Prisma.ReplacementEvaluationWhereInput["state"] } : {}),
  };
}

async function ReportCenterSection({ canViewFinance }: { canViewFinance: boolean }) {
  const session = await getRequiredSession();
  const assetScope = { ...getAssetScopeWhere(session), isActive: true };
  const dueWhere = {
    asset: assetScope,
    state: { in: [RECOMMENDATION_STATE.APPROACHING, RECOMMENDATION_STATE.OVERDUE] },
  };

  const [dueCount, dueCost, departmentRows, disposalSummary] = await Promise.all([
    db.replacementEvaluation.count({ where: dueWhere }),
    db.replacementEvaluation.aggregate({
      _sum: { estimatedReplacementCost: true },
      where: dueWhere,
    }),
    canViewFinance ? getDepartmentCostReport(session) : Promise.resolve([]),
    canViewFinance ? getDisposalSummaryReport(session) : Promise.resolve([]),
  ]);

  return (
    <ReportCenter
      dueCount={dueCount}
      dueCost={Number(dueCost._sum.estimatedReplacementCost ?? 0)}
      departmentRows={departmentRows}
      disposalSummary={disposalSummary}
      canViewFinance={canViewFinance}
    />
  );
}

async function ReportTrendSection({
  q,
  stateQuery,
}: {
  q: string | undefined;
  stateQuery: string | undefined;
}) {
  const session = await getRequiredSession();
  const trendData = await getReplacementCostTrend(session, { q, state: stateQuery });
  return <ReportCharts trendData={trendData} />;
}

async function ReportValuationSection({
  vPage,
  vPageSize,
  vSkip,
  vTake,
}: {
  vPage: number;
  vPageSize: number;
  vSkip: number;
  vTake: number;
}) {
  const session = await getRequiredSession();
  const { rows, totalCount } = await getEndOfLifeValuationPage(session, {
    skip: vSkip,
    take: vTake,
  });

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-purple-950">End-of-Life FMV</CardTitle>
        <p className="text-sm text-purple-900/65">
          Approaching and overdue assets with current and recommended sale values. Export includes all matching rows.
        </p>
      </CardHeader>
      <CardContent>
        <TableToolbar
          paramPrefix="v"
          showSearch={false}
          filters={<ReportExportButtons report="end-of-life-valuation" />}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Purchase</TableHead>
              <TableHead>Current Value</TableHead>
              <TableHead>Recommended Sale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.assetId}>
                <TableCell>{row.assetName}</TableCell>
                <TableCell>{row.state}</TableCell>
                <TableCell>GHS {row.purchaseCost.toLocaleString()}</TableCell>
                <TableCell>GHS {row.currentValue.toLocaleString()}</TableCell>
                <TableCell>GHS {row.recommendedSalePrice.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={vPage}
          totalItems={totalCount}
          pageSize={vPageSize}
          paramPrefix="v"
        />
      </CardContent>
    </Card>
  );
}

async function ReportTableSection({
  q,
  stateQuery,
  page,
  pageSize,
  skip,
  take,
}: {
  q: string | undefined;
  stateQuery: string | undefined;
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}) {
  const session = await getRequiredSession();
  const whereBase = buildWhereBase(session, q, stateQuery);
  const [rows, totalCount] = await Promise.all([
    db.replacementEvaluation.findMany({
      where: whereBase,
      include: { asset: { include: { branch: true } } },
      orderBy: { calculatedAt: "desc" },
      skip,
      take,
    }),
    db.replacementEvaluation.count({ where: whereBase }),
  ]);

  return (
    <Card className="border-purple-200">
      <CardContent className="pt-6">
        <TableToolbar
          searchPlaceholder="Search by asset name or AIN"
          filters={
            <>
              <RecommendationStateFilter />
              <ReportExportButtons report="replacement" />
            </>
          }
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.asset.name}</TableCell>
                <TableCell>{row.asset.branch.name}</TableCell>
                <TableCell>{row.state}</TableCell>
                <TableCell>{Number(row.estimatedReplacementCost).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination currentPage={page} totalItems={totalCount} pageSize={pageSize} />
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`w-full rounded-xl bg-purple-50 ${className ?? "h-48"}`} />;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const canViewFinance = hasPermission(session.role, PERMISSION_KEYS.FINANCE_READ);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const state = getOptionalQuery(params, "state");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params);
  const { page: vPage, pageSize: vPageSize, skip: vSkip, take: vTake } = resolvePagePaginationFromParams(params, {
    prefix: "v",
  });
  const stateQuery =
    state && Object.values(RECOMMENDATION_STATE).includes(state.toUpperCase() as (typeof RECOMMENDATION_STATE)[keyof typeof RECOMMENDATION_STATE])
      ? state.toUpperCase()
      : undefined;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Replacement, department cost, disposal, and end-of-life valuation reports."
      />
      <Suspense fallback={<PageLoading rows={4} />}>
        <ReportCenterSection canViewFinance={canViewFinance} />
      </Suspense>
      <div className="mt-4">
        <Suspense fallback={<SectionSkeleton className="h-72" />}>
          <ReportTrendSection q={q} stateQuery={stateQuery} />
        </Suspense>
      </div>
      {canViewFinance ? (
        <div className="mt-4">
          <Suspense fallback={<SectionSkeleton className="h-96" />}>
            <ReportValuationSection vPage={vPage} vPageSize={vPageSize} vSkip={vSkip} vTake={vTake} />
          </Suspense>
        </div>
      ) : null}
      <div className="mt-4">
        <Suspense fallback={<SectionSkeleton className="h-96" />}>
          <ReportTableSection q={q} stateQuery={stateQuery} page={page} pageSize={pageSize} skip={skip} take={take} />
        </Suspense>
      </div>
    </div>
  );
}
