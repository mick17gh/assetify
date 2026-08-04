import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { PAGINATION } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import {
  describeAuditAction,
  formatAuditAssetLabel,
  formatAuditEntityType,
} from "@/lib/audit-labels";
import { Prisma } from "@/lib/generated/prisma/client";

async function AuditContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params, {
    defaultPageSize: PAGINATION.SETTINGS_DEFAULT_LIMIT,
  });

  const where: Prisma.AuditLogWhereInput = {
    organizationId: session.organizationId ?? undefined,
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" } },
            { entityType: { contains: q, mode: "insensitive" } },
            { entityId: { contains: q, mode: "insensitive" } },
            { actor: { name: { contains: q, mode: "insensitive" } } },
            { actor: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [rows, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, email: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    db.auditLog.count({ where }),
  ]);

  const assetIds = [
    ...new Set(
      rows
        .filter((row) => row.entityType === "Asset" && row.entityId)
        .map((row) => row.entityId as string),
    ),
  ];
  const assets = assetIds.length
    ? await db.asset.findMany({
        where: { id: { in: assetIds }, organizationId: session.organizationId ?? undefined },
        select: { id: true, name: true, ain: true },
      })
    : [];
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));

  return (
    <SetupTableShell
      searchPlaceholder="Search by action, user, or entity"
      currentPage={page}
      totalItems={totalCount}
      pageSize={pageSize}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Page</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Date/Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-purple-900/60">
                No audit entries found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const labels = describeAuditAction(row.action, row.entityType);
              const asset =
                row.entityType === "Asset" && row.entityId ? assetById.get(row.entityId) : undefined;
              const assetLabel = asset
                ? `${asset.name} (${asset.ain})`
                : formatAuditAssetLabel(row.metadata, row.entityType, row.entityId);

              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-purple-950">{labels.action}</TableCell>
                  <TableCell>{labels.page}</TableCell>
                  <TableCell>{formatAuditEntityType(row.entityType)}</TableCell>
                  <TableCell>
                    {asset ? (
                      <Link href={`/assets/${asset.id}`} className="font-medium text-[#6D28D9] hover:underline">
                        {assetLabel}
                      </Link>
                    ) : (
                      assetLabel
                    )}
                  </TableCell>
                  <TableCell>{row.actor?.name ?? "System"}</TableCell>
                  <TableCell>{row.createdAt.toLocaleString()}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </SetupTableShell>
  );
}

export default function AuditSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <PageHeader
        title="Activity History"
        description="A readable log of who changed what across Assetify — useful for reviews and accountability."
      />
      <Suspense fallback={<PageLoading rows={5} />}>
        <AuditContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
