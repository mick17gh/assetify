import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { PageLoading } from "@/components/shared/page-loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { SearchParams } from "@/lib/filters/query";

async function AuditContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);

  const rows = await db.auditLog.findMany({
    where: { organizationId: session.organizationId ?? undefined },
    orderBy: { createdAt: "desc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
  });
  const nextCursor = getNextCursor(rows, limit);
  const pageItems = rows.slice(0, limit);

  return (
    <SetupTableShell searchPlaceholder="Search audit entries" defaultLimit={limit} nextCursor={nextCursor} shownCount={pageItems.length}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.action}</TableCell>
              <TableCell>
                {row.entityType}
                {row.entityId ? ` (${row.entityId.slice(0, 8)}…)` : ""}
              </TableCell>
              <TableCell>{row.createdAt.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SetupTableShell>
  );
}

export default function AuditSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <PageHeader title="Audit Log" description="Administrative activity history." />
      <Suspense fallback={<PageLoading rows={5} />}>
        <AuditContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
