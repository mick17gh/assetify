import { ReportCenter } from "@/components/reports/report-center";
import { ReportCharts } from "@/components/reports/report-charts";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";
import { RecommendationStateFilter } from "@/components/shared/recommendation-state-filter";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { PERMISSION_KEYS, RECOMMENDATION_STATE } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { hasPermission } from "@/lib/permissions";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  getDepartmentCostReport,
  getDisposalReport,
  getEndOfLifeValuationReport,
} from "@/lib/reports";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const canViewFinance = hasPermission(session.role, PERMISSION_KEYS.FINANCE_READ);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const state = getOptionalQuery(params, "state");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);
  const stateQuery =
    state && Object.values(RECOMMENDATION_STATE).includes(state.toUpperCase() as (typeof RECOMMENDATION_STATE)[keyof typeof RECOMMENDATION_STATE])
      ? state.toUpperCase()
      : undefined;
  const whereBase: Prisma.ReplacementEvaluationWhereInput = {
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

  const [dueCount, dueCost, departmentRows, disposalData, valuationRows] = await Promise.all([
    db.replacementEvaluation.count({
      where: {
        asset: { ...getAssetScopeWhere(session), isActive: true },
        state: { in: [RECOMMENDATION_STATE.APPROACHING, RECOMMENDATION_STATE.OVERDUE] },
      },
    }),
    db.replacementEvaluation.aggregate({
      _sum: { estimatedReplacementCost: true },
      where: {
        asset: { ...getAssetScopeWhere(session), isActive: true },
        state: { in: [RECOMMENDATION_STATE.APPROACHING, RECOMMENDATION_STATE.OVERDUE] },
      },
    }),
    canViewFinance ? getDepartmentCostReport(session) : Promise.resolve([]),
    canViewFinance ? getDisposalReport(session) : Promise.resolve({ records: [], summary: [] }),
    canViewFinance ? getEndOfLifeValuationReport(session) : Promise.resolve([]),
  ]);

  const [rows, trendRows] = await Promise.all([
    db.replacementEvaluation.findMany({
      where: whereBase,
      include: { asset: { include: { branch: true } } },
      orderBy: { calculatedAt: "desc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
    }),
    db.replacementEvaluation.findMany({
      where: whereBase,
      orderBy: { recommendedReplaceDate: "asc" },
      take: 500,
    }),
  ]);
  const nextCursor = getNextCursor(rows, limit);
  const pageItems = rows.slice(0, limit);
  const trendMap = new Map<string, number>();
  trendRows.forEach((row) => {
    const month = row.recommendedReplaceDate.toLocaleString("en-US", { month: "short" });
    trendMap.set(month, (trendMap.get(month) ?? 0) + Number(row.estimatedReplacementCost));
  });
  const trendData = Array.from(trendMap.entries()).map(([month, cost]) => ({ month, cost }));

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Replacement, department cost, disposal, and end-of-life valuation reports."
      />
      <ReportCenter
        dueCount={dueCount}
        dueCost={Number(dueCost._sum.estimatedReplacementCost ?? 0)}
        departmentRows={departmentRows}
        disposalSummary={disposalData.summary}
        valuationRows={valuationRows}
        canViewFinance={canViewFinance}
      />
      <div className="mt-4">
        <ReportCharts trendData={trendData} />
      </div>
      <Card className="mt-4 border-purple-200">
        <CardContent className="pt-6">
          <TableToolbar
            searchPlaceholder="Search by asset name or AIN"
            defaultLimit={limit}
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
              {pageItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.asset.name}</TableCell>
                  <TableCell>{row.asset.branch.name}</TableCell>
                  <TableCell>{row.state}</TableCell>
                  <TableCell>{Number(row.estimatedReplacementCost).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls nextCursor={nextCursor} shownCount={pageItems.length} limit={limit} />
        </CardContent>
      </Card>
    </div>
  );
}
