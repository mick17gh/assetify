import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { createVendorAction, deleteVendorAction, updateVendorAction } from "../actions";

export default async function VendorsSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);

  const rows = await db.vendor.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    orderBy: { name: "asc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
  });
  const nextCursor = getNextCursor(rows, limit);
  const pageItems = rows.slice(0, limit);

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Suppliers and service vendors for asset procurement."
        action={
          <SetupCreateModal title="Create vendor" triggerLabel="Add Vendor" action={createVendorAction}>
            <SetupTextField name="name" label="Name" required />
            <SetupTextField name="email" label="Email" type="email" />
            <SetupTextField name="phone" label="Phone" />
          </SetupCreateModal>
        }
      />
      <SetupTableShell searchPlaceholder="Search vendors" defaultLimit={limit} nextCursor={nextCursor} shownCount={pageItems.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email ?? "-"}</TableCell>
                <TableCell>{row.phone ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <SetupRowActions
                    recordId={row.id}
                    editTitle="Edit vendor"
                    updateAction={updateVendorAction}
                    deleteAction={deleteVendorAction}
                    editFields={
                      <>
                        <SetupTextField name="name" label="Name" required defaultValue={row.name} />
                        <SetupTextField name="email" label="Email" type="email" defaultValue={row.email ?? ""} />
                        <SetupTextField name="phone" label="Phone" defaultValue={row.phone ?? ""} />
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
