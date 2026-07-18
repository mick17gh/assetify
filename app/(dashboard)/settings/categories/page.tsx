import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "../actions";

async function CategoriesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);

  const rows = await db.category.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    orderBy: { name: "asc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
  });
  const nextCursor = getNextCursor(rows, limit);
  const pageItems = rows.slice(0, limit);

  return (
    <SetupTableShell searchPlaceholder="Search categories" defaultLimit={limit} nextCursor={nextCursor} shownCount={pageItems.length}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Replacement Years</TableHead>
            <TableHead>Grace Months</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.replacementYears}</TableCell>
              <TableCell>{row.disposalGraceMonths}</TableCell>
              <TableCell className="text-right">
                <SetupRowActions
                  recordId={row.id}
                  editTitle="Edit category"
                  updateAction={updateCategoryAction}
                  deleteAction={deleteCategoryAction}
                  editFields={
                    <>
                      <SetupTextField name="name" label="Name" required defaultValue={row.name} />
                      <SetupTextField name="replacementYears" label="Replacement years" type="number" required defaultValue={String(row.replacementYears)} />
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
  );
}

export default function CategoriesSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Asset categories with default replacement timelines."
        action={
          <SetupCreateModal title="Create category" triggerLabel="Add Category" action={createCategoryAction}>
            <SetupTextField name="name" label="Name" required />
            <SetupTextField name="replacementYears" label="Replacement years" type="number" required defaultValue="3" />
            <SetupTextField name="disposalGraceMonths" label="Disposal grace (months)" type="number" required defaultValue="6" />
          </SetupCreateModal>
        }
      />
      <Suspense fallback={<PageLoading rows={5} />}>
        <CategoriesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
