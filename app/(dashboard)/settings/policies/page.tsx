import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { ReferenceSelect } from "@/components/shared/reference-selects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import {
  createReplacementPolicyAction,
  deleteReplacementPolicyAction,
  updateReplacementPolicyAction,
} from "../actions";

export default async function PoliciesSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);

  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.name }));

  const rows = await db.replacementPolicy.findMany({
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
        title="Replacement Policies"
        description="Category-specific replacement and disposal rules."
        action={
          <SetupCreateModal title="Create policy" triggerLabel="Add Policy" action={createReplacementPolicyAction}>
            <ReferenceSelect name="categoryId" label="Category" options={categoryOptions} required />
            <SetupTextField name="replacementYears" label="Replacement years" type="number" required defaultValue="3" />
            <SetupTextField name="disposalGraceMonths" label="Grace months" type="number" required defaultValue="6" />
          </SetupCreateModal>
        }
      />
      <SetupTableShell searchPlaceholder="Search by category" defaultLimit={limit} nextCursor={nextCursor} shownCount={pageItems.length}>
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
            {pageItems.map((row) => (
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
    </div>
  );
}
