import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { ReferenceSelect } from "@/components/shared/reference-selects";
import { EnumSelect } from "@/components/shared/enum-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { DEPRECIATION_METHOD } from "@/constants";
import {
  createDepreciationPolicyAction,
  deleteDepreciationPolicyAction,
  updateDepreciationPolicyAction,
} from "../actions";

export default async function DepreciationSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);

  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.name }));

  const rows = await db.depreciationPolicy.findMany({
    where: {
      organizationId: session.organizationId ?? undefined,
      ...(q ? { category: { name: { contains: q, mode: "insensitive" } } } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
  });
  const nextCursor = getNextCursor(rows, limit);
  const pageItems = rows.slice(0, limit);

  return (
    <div>
      <PageHeader
        title="Depreciation Policies"
        description="Define straight-line depreciation rules per asset category."
        action={
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
        }
      />
      <SetupTableShell searchPlaceholder="Search by category" defaultLimit={limit} nextCursor={nextCursor} shownCount={pageItems.length}>
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
            {pageItems.map((row) => (
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
    </div>
  );
}
