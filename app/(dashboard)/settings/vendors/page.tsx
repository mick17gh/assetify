import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { PAGINATION } from "@/constants";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { createVendorAction, deleteVendorAction, updateVendorAction } from "../actions";

async function VendorsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params, {
    defaultPageSize: PAGINATION.SETTINGS_DEFAULT_LIMIT,
  });

  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};
  const [rows, totalCount] = await Promise.all([
    db.vendor.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
    }),
    db.vendor.count({ where }),
  ]);

  return (
    <SetupTableShell
      searchPlaceholder="Search vendors"
      currentPage={page}
      totalItems={totalCount}
      pageSize={pageSize}
    >
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
          {rows.map((row) => (
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
  );
}

export default function VendorsSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
      <Suspense fallback={<PageLoading rows={5} />}>
        <VendorsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
