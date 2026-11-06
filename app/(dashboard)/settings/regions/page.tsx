import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { PAGINATION } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { Prisma } from "@/lib/generated/prisma/client";
import { createRegionAction, deleteRegionAction, updateRegionAction } from "../actions";

async function RegionsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params, {
    defaultPageSize: PAGINATION.SETTINGS_DEFAULT_LIMIT,
  });

  const where: Prisma.RegionWhereInput = {
    organizationId: session.organizationId ?? undefined,
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };

  const [rows, totalCount] = await Promise.all([
    db.region.findMany({
      where,
      include: { _count: { select: { branches: true } } },
      orderBy: { name: "asc" },
      skip,
      take,
    }),
    db.region.count({ where }),
  ]);

  return (
    <SetupTableShell searchPlaceholder="Search regions" currentPage={page} totalItems={totalCount} pageSize={pageSize}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Branches</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((region) => (
            <TableRow key={region.id}>
              <TableCell>{region.name}</TableCell>
              <TableCell>{region._count.branches}</TableCell>
              <TableCell className="text-right">
                <SetupRowActions
                  recordId={region.id}
                  editTitle="Edit region"
                  updateAction={updateRegionAction}
                  deleteAction={deleteRegionAction}
                  editFields={<SetupTextField name="name" label="Name" required defaultValue={region.name} />}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SetupTableShell>
  );
}

export default function RegionsSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <PageHeader
        title="Regions"
        description="Group branches into regions. Every branch belongs to one region."
        action={
          <SetupCreateModal title="Create region" triggerLabel="Add Region" action={createRegionAction}>
            <SetupTextField name="name" label="Name" required />
          </SetupCreateModal>
        }
      />
      <Suspense fallback={<PageLoading rows={5} />}>
        <RegionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
