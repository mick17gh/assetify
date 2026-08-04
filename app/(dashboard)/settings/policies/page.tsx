import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { ReferenceSelect } from "@/components/shared/reference-selects";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { PAGINATION } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import {
  createReplacementPolicyAction,
  deleteReplacementPolicyAction,
  updateReplacementPolicyAction,
} from "../actions";

async function PoliciesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
    db.replacementPolicy.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.replacementPolicy.count({ where }),
  ]);
  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.name }));

  return (
    <>
      <div className="mb-4 flex justify-end">
        <SetupCreateModal title="Create policy" triggerLabel="Add Policy" action={createReplacementPolicyAction}>
          <ReferenceSelect name="categoryId" label="Category" options={categoryOptions} required />
          <SetupTextField name="replacementYears" label="Replacement years" type="number" required defaultValue="3" />
          <SetupTextField name="disposalGraceMonths" label="Grace months" type="number" required defaultValue="6" />
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
              <TableHead>Years</TableHead>
              <TableHead>Grace</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.category.name}</TableCell>
                <TableCell>{row.replacementYears}</TableCell>
                <TableCell>{row.disposalGraceMonths}</TableCell>
                <TableCell className="text-right">
                  <SetupRowActions
                    recordId={row.id}
                    editTitle="Edit policy"
                    updateAction={updateReplacementPolicyAction}
                    deleteAction={deleteReplacementPolicyAction}
                    editFields={
                      <>
                        <ReferenceSelect name="categoryId" label="Category" options={categoryOptions} defaultValue={row.categoryId} required />
                        <SetupTextField name="replacementYears" label="Years" type="number" required defaultValue={String(row.replacementYears)} />
                        <SetupTextField name="disposalGraceMonths" label="Grace months" type="number" required defaultValue={String(row.disposalGraceMonths)} />
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

export default function PoliciesSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <PageHeader title="Replacement Policies" description="Category-specific replacement and disposal rules." />
      <Suspense fallback={<PageLoading rows={5} />}>
        <PoliciesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
