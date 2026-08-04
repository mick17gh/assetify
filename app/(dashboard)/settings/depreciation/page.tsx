import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { ReferenceSelect } from "@/components/shared/reference-selects";
import { EnumSelect } from "@/components/shared/enum-select";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { DEPRECIATION_METHOD, PAGINATION } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
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

  const [categories, rows, totalCount] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.depreciationPolicy.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.depreciationPolicy.count({ where }),
  ]);
  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.name }));

  return (
    <>
      <div className="mb-4 flex justify-end">
        <SetupCreateModal title="Create depreciation policy" triggerLabel="Add Policy" action={createDepreciationPolicyAction}>
          <ReferenceSelect name="categoryId" label="Category" options={categoryOptions} required />
          <EnumSelect
            name="method"
            label="Method"
            labelKey="depreciationMethod"
            values={DEPRECIATION_METHOD}
            defaultValue={DEPRECIATION_METHOD.STRAIGHT_LINE}
            required
          />
          <SetupTextField name="usefulLifeYears" label="Useful life (years)" type="number" required defaultValue="5" />
          <SetupTextField name="salvagePercent" label="Salvage %" type="number" required defaultValue="10" />
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.category.name}</TableCell>
                <TableCell>{row.method}</TableCell>
                <TableCell>{row.usefulLifeYears}</TableCell>
                <TableCell>{Number(row.salvagePercent)}</TableCell>
                <TableCell className="text-right">
                  <SetupRowActions
                    recordId={row.id}
                    editTitle="Edit depreciation policy"
                    updateAction={updateDepreciationPolicyAction}
                    deleteAction={deleteDepreciationPolicyAction}
                    editFields={
                      <>
                        <ReferenceSelect name="categoryId" label="Category" options={categoryOptions} defaultValue={row.categoryId} required />
                        <EnumSelect
                          name="method"
                          label="Method"
                          labelKey="depreciationMethod"
                          values={DEPRECIATION_METHOD}
                          defaultValue={row.method}
                          required
                        />
                        <SetupTextField name="usefulLifeYears" label="Life (years)" type="number" required defaultValue={String(row.usefulLifeYears)} />
                        <SetupTextField name="salvagePercent" label="Salvage %" type="number" required defaultValue={String(Number(row.salvagePercent))} />
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
        description="Define straight-line depreciation rules per asset category."
      />
      <Suspense fallback={<PageLoading rows={5} />}>
        <DepreciationContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
