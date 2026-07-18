import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { Prisma } from "@/lib/generated/prisma/client";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { PrintLocationTagButton } from "@/components/settings/print-location-tag-button";
import { createBranchAction, deleteBranchAction, updateBranchAction } from "../actions";

async function BranchesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);

  const where: Prisma.BranchWhereInput = {
    organizationId: session.organizationId ?? undefined,
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };

  const [qrEnabled, rows] = await Promise.all([
    session.organizationId ? isQrLocationScanningEnabled(session.organizationId) : Promise.resolve(false),
    db.branch.findMany({
      where,
      include: { _count: { select: { assets: true, users: true } } },
      orderBy: { name: "asc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
    }),
  ]);
  const nextCursor = getNextCursor(rows, limit);
  const pageItems = rows.slice(0, limit);

  return (
    <SetupTableShell
      searchPlaceholder="Search branches"
      defaultLimit={limit}
      nextCursor={nextCursor}
      shownCount={pageItems.length}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Assets</TableHead>
            <TableHead>Users</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((branch) => (
            <TableRow key={branch.id}>
              <TableCell>{branch.name}</TableCell>
              <TableCell>{branch.code}</TableCell>
              <TableCell>{branch._count.assets}</TableCell>
              <TableCell>{branch._count.users}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {qrEnabled ? <PrintLocationTagButton id={branch.id} type="branch" /> : null}
                  <SetupRowActions
                    recordId={branch.id}
                    editTitle="Edit branch"
                    updateAction={updateBranchAction}
                    deleteAction={deleteBranchAction}
                    editFields={
                      <>
                        <SetupTextField name="name" label="Name" required defaultValue={branch.name} />
                        <SetupTextField name="code" label="Code" required defaultValue={branch.code} />
                        <SetupTextField name="address" label="Address" defaultValue={branch.address ?? ""} />
                      </>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SetupTableShell>
  );
}

export default function BranchesSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <PageHeader
        title="Branches"
        description="Create and manage branches for asset scoping."
        action={
          <SetupCreateModal title="Create branch" triggerLabel="Add Branch" action={createBranchAction}>
            <SetupTextField name="name" label="Name" required />
            <SetupTextField name="code" label="Code" required placeholder="HQ-ACCRA" />
            <SetupTextField name="address" label="Address" />
          </SetupCreateModal>
        }
      />
      <Suspense fallback={<PageLoading rows={5} />}>
        <BranchesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
