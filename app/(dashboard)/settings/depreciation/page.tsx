import { Suspense } from "react";
import { PageHeader, pageActionGroupClass } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { DepreciationMethodFields } from "@/components/settings/declining-rate-field";
import { ReferenceSelect } from "@/components/shared/reference-selects";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { ENUM_LABELS, PAGINATION } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { PeriodDepreciationRunCard } from "@/components/settings/period-depreciation-run";
import {
  createDepreciationPolicyAction,
  deleteDepreciationPolicyAction,
  updateDepreciationPolicyAction,
} from "../actions";

async function DepreciationContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params, {
    defaultPageSize: PAGINATION.SETTINGS_DEFAULT_LIMIT,
  });

  const where = {
    organizationId: session.organizationId ?? undefined,
    ...(q ? { category: { name: { contains: q, mode: "insensitive" as const } } } : {}),
  };

  const [categories, rows, totalCount, recentRuns] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.depreciationPolicy.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.depreciationPolicy.count({ where }),
    session.organizationId
      ? db.depreciationRun.findMany({
          where: { organizationId: session.organizationId },
          orderBy: { runAt: "desc" },
          take: 5,
          include: { _count: { select: { lines: true } } },
        })
      : Promise.resolve([]),
  ]);
  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.name }));

  return (
    <>
      <PeriodDepreciationRunCard
        recentRuns={recentRuns.map((run) => ({
          id: run.id,
          period: `${run.periodStart.toLocaleDateString()} – ${run.periodEnd.toLocaleDateString()}`,
          runAt: run.runAt.toLocaleString(),
          lineCount: run._count.lines,
          notes: run.notes,
        }))}
      />
      <div className={`${pageActionGroupClass} mb-4 sm:ml-auto`}>
        <SetupCreateModal title="Create depreciation policy" triggerLabel="Add Policy" action={createDepreciationPolicyAction}>
          <ReferenceSelect name="categoryId" label="Category" options={categoryOptions} required />
          <DepreciationMethodFields />
        </SetupCreateModal>
      </div>
      <SetupTableShell
        searchPlaceholder="Search by category"
        currentPage={page}
        totalItems={totalCount}
        pageSize={pageSize}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Life (yrs)</TableHead>
              <TableHead>Salvage %</TableHead>
              <TableHead>DB rate %</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.category.name}</TableCell>
                <TableCell>{ENUM_LABELS.depreciationMethod[row.method] ?? row.method}</TableCell>
                <TableCell>{row.usefulLifeYears}</TableCell>
                <TableCell>{Number(row.salvagePercent)}</TableCell>
                <TableCell>
                  {row.decliningRatePercent != null ? Number(row.decliningRatePercent) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <SetupRowActions
                    recordId={row.id}
                    editTitle="Edit depreciation policy"
                    updateAction={updateDepreciationPolicyAction}
                    deleteAction={deleteDepreciationPolicyAction}
                    editFields={
                      <>
                        <ReferenceSelect name="categoryId" label="Category" options={categoryOptions} defaultValue={row.categoryId} required />
                        <DepreciationMethodFields
                          defaultMethod={row.method}
                          defaultUsefulLife={String(row.usefulLifeYears)}
                          defaultSalvage={String(Number(row.salvagePercent))}
                          defaultDecliningRate={
                            row.decliningRatePercent != null ? String(Number(row.decliningRatePercent)) : "40"
                          }
                        />
                      </>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SetupTableShell>
    </>
  );
}

export default function DepreciationSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <PageHeader
        title="Depreciation Policies"
        description="Define depreciation method, useful life, and salvage rules per asset category."
      />
      <Suspense fallback={<PageLoading rows={5} />}>
        <DepreciationContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
