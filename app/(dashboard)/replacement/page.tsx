import Link from "next/link";
import { acknowledgeDisposalAction, recomputeReplacementAction } from "@/app/(dashboard)/replacement/actions";
import { ReplacementOverview } from "@/components/replacement/replacement-overview";
import { RecommendationStateFilter } from "@/components/shared/recommendation-state-filter";
import { SubmitButton } from "@/components/shared/submit-button";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { RECOMMENDATION_STATE } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function ReplacementPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const state = getOptionalQuery(params, "state");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);
  const stateQuery =
    state && Object.values(RECOMMENDATION_STATE).includes(state.toUpperCase() as (typeof RECOMMENDATION_STATE)[keyof typeof RECOMMENDATION_STATE])
      ? state.toUpperCase()
      : undefined;

  const whereBase: Prisma.ReplacementEvaluationWhereInput = {
    asset: getAssetScopeWhere(session),
    ...(stateQuery ? { state: stateQuery as Prisma.ReplacementEvaluationWhereInput["state"] } : {}),
    ...(q
      ? {
          asset: {
            ...getAssetScopeWhere(session),
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { ain: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [healthy, approaching, overdue, rows] = await Promise.all([
    db.replacementEvaluation.count({ where: { ...whereBase, state: RECOMMENDATION_STATE.HEALTHY } }),
    db.replacementEvaluation.count({ where: { ...whereBase, state: RECOMMENDATION_STATE.APPROACHING } }),
    db.replacementEvaluation.count({ where: { ...whereBase, state: RECOMMENDATION_STATE.OVERDUE } }),
    db.replacementEvaluation.findMany({
      where: whereBase,
      include: { asset: true },
      orderBy: { recommendedReplaceDate: "asc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
    }),
  ]);
  const nextCursor = getNextCursor(rows, limit);
  const pageItems = rows.slice(0, limit);

  return (
    <div>
      <PageHeader
        title="Replacement Planning"
        description="Policy-driven replacement timelines, indicators, and disposal recommendations."
        action={
          <form action={recomputeReplacementAction}>
            <SubmitButton idleLabel="Recompute Engine" pendingLabel="Recomputing..." className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]" />
          </form>
        }
      />
      <ReplacementOverview
        healthy={healthy}
        approaching={approaching}
        overdue={overdue}
        recomputeAction={recomputeReplacementAction}
      />
      <Card className="mt-4 border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar searchPlaceholder="Search by asset name or AIN" defaultLimit={limit} />
          <div className="mb-4 flex justify-end">
            <RecommendationStateFilter />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Replace Date</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/assets/${row.assetId}`} className="font-medium text-[#6D28D9] hover:underline">
                      {row.asset.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.state}</TableCell>
                  <TableCell>{row.recommendedReplaceDate.toLocaleDateString()}</TableCell>
                  <TableCell>{Number(row.estimatedReplacementCost).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {row.state === RECOMMENDATION_STATE.OVERDUE ? (
                      <form action={acknowledgeDisposalAction}>
                        <input type="hidden" name="assetId" value={row.assetId} />
                        <SubmitButton
                          idleLabel="Acknowledge disposal"
                          pendingLabel="Acknowledging..."
                          className="h-7 cursor-pointer border-purple-200 bg-white px-2.5 text-xs text-purple-800 shadow-none hover:bg-purple-50"
                        />
                      </form>
                    ) : (
                      "-"
                    )}
                  </TableCell>
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
