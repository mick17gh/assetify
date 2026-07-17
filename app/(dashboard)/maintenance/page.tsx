import { MaintenanceBoard, MaintenanceRowActions, MaintenanceStatusBadge } from "@/components/maintenance/maintenance-board";
import { MaintenanceStatusFilter } from "@/components/maintenance/maintenance-status-filter";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MAINTENANCE_STATUS } from "@/constants";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const assetScope = getAssetScopeWhere(session);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const statusFilter = getOptionalQuery(params, "status");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);
  const statusQuery =
    statusFilter && Object.values(MAINTENANCE_STATUS).includes(statusFilter as (typeof MAINTENANCE_STATUS)[keyof typeof MAINTENANCE_STATUS])
      ? (statusFilter as Prisma.MaintenanceRecordWhereInput["status"])
      : undefined;

  const where: Prisma.MaintenanceRecordWhereInput = {
    asset: assetScope,
    ...(statusQuery ? { status: statusQuery } : {}),
    ...(q ? { description: { contains: q, mode: "insensitive" } } : {}),
  };
  const [records, assets, totalRecords, openFlags, criticalFlags, latestFlags] = await Promise.all([
    db.maintenanceRecord.findMany({
      where,
      include: { asset: true },
      orderBy: { serviceDate: "desc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
    }),
    db.asset.findMany({
      where: assetScope,
      orderBy: { name: "asc" },
      select: { id: true, name: true, ain: true },
      take: 300,
    }),
    db.maintenanceRecord.count({ where: { asset: assetScope } }),
    db.conditionFlag.count({ where: { asset: assetScope, resolvedAt: null } }),
    db.conditionFlag.count({
      where: { asset: assetScope, resolvedAt: null, severity: "CRITICAL" },
    }),
    db.conditionFlag.findMany({
      where: { asset: assetScope, resolvedAt: null },
      include: { asset: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const nextCursor = getNextCursor(records, limit);
  const pageItems = records.slice(0, limit);
  const assetOptions = assets.map((asset) => ({ id: asset.id, label: `${asset.name} (${asset.ain})` }));

  return (
    <div>
      <PageHeader
        title="Status and Maintenance"
        description="Lifecycle flow from purchased through disposal with service history."
      />
      <MaintenanceBoard
        assets={assetOptions}
        totalRecords={totalRecords}
        openFlags={openFlags}
        criticalFlags={criticalFlags}
        latestFlags={latestFlags.map((flag) => ({
          id: flag.id,
          title: flag.title,
          severity: flag.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          assetName: flag.asset.name,
        }))}
      />
      <Card className="mt-4 border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar searchPlaceholder="Search service notes" defaultLimit={limit} />
          <div className="mb-4 flex justify-end">
            <MaintenanceStatusFilter />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.asset.name}</TableCell>
                  <TableCell>{record.serviceDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <MaintenanceStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.cost ? Number(record.cost).toLocaleString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <MaintenanceRowActions
                      recordId={record.id}
                      assetId={record.assetId}
                      description={record.description}
                      serviceDate={record.serviceDate.toISOString().slice(0, 10)}
                      cost={record.cost ? String(record.cost) : ""}
                      vendorName={record.vendorName ?? ""}
                      nextServiceDate={record.nextServiceDate ? record.nextServiceDate.toISOString().slice(0, 10) : ""}
                      status={record.status}
                      assets={assetOptions}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls nextCursor={nextCursor} shownCount={pageItems.length} limit={limit} />
        </CardContent>
      </Card>
    </div>
  );
}
