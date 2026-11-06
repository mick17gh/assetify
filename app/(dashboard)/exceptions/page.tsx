import Link from "next/link";
import { ExceptionDetailSheet } from "@/components/exceptions/exception-detail-sheet";
import { ExceptionFilters } from "@/components/exceptions/exception-filters";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENUM_LABELS, EXCEPTION_STATUS, EXCEPTION_TYPE, PERMISSION_KEYS } from "@/constants";
import { db } from "@/lib/db";
import { OPEN_EXCEPTION_STATUSES } from "@/lib/exception-service";
import { getOptionalQuery, type SearchParams } from "@/lib/filters/query";
import type { ExceptionStatus, ExceptionType, Prisma } from "@/lib/generated/prisma/client";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { hasPermission } from "@/lib/permissions";
import { requireOrganizationId } from "@/lib/scoping";
import { getRequiredSession } from "@/lib/session";

export default async function ExceptionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const organizationId = requireOrganizationId(session);
  const canWrite = hasPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const params = await searchParams;
  const type = getOptionalQuery(params, "type") ?? "";
  const status = getOptionalQuery(params, "status") ?? "";
  const assignee = getOptionalQuery(params, "assignee") ?? "";
  const selectedId = getOptionalQuery(params, "id") ?? "";
  const q = getOptionalQuery(params, "q");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params);

  const typeValues = new Set<string>(Object.values(EXCEPTION_TYPE));
  const statusValues = new Set<string>(Object.values(EXCEPTION_STATUS));
  const where: Prisma.AssetExceptionWhereInput = {
    organizationId,
    ...(type && typeValues.has(type) ? { type: type as ExceptionType } : {}),
    ...(assignee ? { assignedToId: assignee } : {}),
    status:
      status && statusValues.has(status)
        ? (status as ExceptionStatus)
        : status === "ALL"
          ? undefined
          : { in: OPEN_EXCEPTION_STATUSES },
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" } },
            { asset: { name: { contains: q, mode: "insensitive" } } },
            { asset: { ain: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [exceptions, totalCount, users] = await Promise.all([
    db.assetException.findMany({
      where,
      include: {
        asset: { select: { ain: true, name: true } },
        assignedTo: { select: { name: true } },
        identifiedBy: { select: { name: true } },
      },
      orderBy: { identifiedAt: "desc" },
      skip,
      take,
    }),
    db.assetException.count({ where }),
    db.user.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const query = new URLSearchParams();
  if (type) query.set("type", type);
  if (status) query.set("status", status);
  if (assignee) query.set("assignee", assignee);
  if (q) query.set("q", q);
  const closeHref = query.size ? `/exceptions?${query.toString()}` : "/exceptions";
  const assignees = users.map((user) => ({ id: user.id, label: user.name }));

  const selected = selectedId
    ? await db.assetException.findFirst({
        where: { id: selectedId, organizationId },
        include: {
          asset: { select: { ain: true, name: true } },
          events: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
          evidence: { orderBy: { createdAt: "asc" } },
        },
      })
    : null;

  return (
    <div>
      <PageHeader
        title="Exceptions"
        description="Open items found during verification or reported from an asset. Closed items stay available in the status filter."
      />
      <Card className="border-navy-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar searchPlaceholder="Search by asset or description" filters={<ExceptionFilters assignees={assignees} />} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Identified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No exceptions match these filters.</TableCell>
                </TableRow>
              ) : (
                exceptions.map((row) => {
                  const href = `/exceptions?${new URLSearchParams({ ...Object.fromEntries(query), id: row.id }).toString()}`;
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link href={href} className="font-medium text-navy-900 hover:underline">
                          {ENUM_LABELS.exceptionType[row.type]}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-navy-200 text-navy-900">
                          {ENUM_LABELS.exceptionStatus[row.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.asset ? `${row.asset.ain} ${row.asset.name}` : "Unregistered"}</TableCell>
                      <TableCell>{row.assignedTo?.name ?? "—"}</TableCell>
                      <TableCell>{row.identifiedBy.name}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalItems={totalCount} pageSize={pageSize} />
        </CardContent>
      </Card>
      {selected ? (
        <ExceptionDetailSheet
          canWrite={canWrite}
          closeHref={closeHref}
          users={assignees}
          exception={{
            id: selected.id,
            typeLabel: ENUM_LABELS.exceptionType[selected.type] ?? selected.type,
            status: selected.status,
            statusLabel: ENUM_LABELS.exceptionStatus[selected.status] ?? selected.status,
            description: selected.description,
            resolution: selected.resolution,
            assetLabel: selected.asset ? `${selected.asset.ain} ${selected.asset.name}` : null,
            assigneeId: selected.assignedToId,
            events: selected.events.map((event) => ({
              id: event.id,
              label: event.fromStatus
                ? `${ENUM_LABELS.exceptionStatus[event.fromStatus]} → ${ENUM_LABELS.exceptionStatus[event.toStatus]}`
                : ENUM_LABELS.exceptionStatus[event.toStatus] ?? event.toStatus,
              actor: event.actor.name,
              note: event.note,
              at: event.createdAt.toLocaleString(),
            })),
            evidence: selected.evidence.map((file) => ({ id: file.id, fileName: file.fileName, fileUrl: file.fileUrl })),
          }}
        />
      ) : null}
    </div>
  );
}
