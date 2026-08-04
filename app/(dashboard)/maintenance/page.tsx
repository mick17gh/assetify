import { MaintenanceBoard, MaintenanceRowActions, MaintenanceStatusBadge } from "@/components/maintenance/maintenance-board";
import { MaintenancePageActions } from "@/components/maintenance/maintenance-page-actions";
import { MaintenanceStatusFilter } from "@/components/maintenance/maintenance-status-filter";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MAINTENANCE_STATUS, PERMISSION_KEYS } from "@/constants";
import { hasPermission } from "@/lib/permissions";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const canUpload = hasPermission(session.role, PERMISSION_KEYS.DOCUMENT_WRITE);
  const canWrite = hasPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const assetScope = getAssetScopeWhere(session);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const statusFilter = getOptionalQuery(params, "status");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params);
  const statusQuery =
    statusFilter && Object.values(MAINTENANCE_STATUS).includes(statusFilter as (typeof MAINTENANCE_STATUS)[keyof typeof MAINTENANCE_STATUS])
      ? (statusFilter as Prisma.MaintenanceRecordWhereInput["status"])
      : undefined;

  const where: Prisma.MaintenanceRecordWhereInput = {
    asset: assetScope,
    ...(statusQuery ? { status: statusQuery } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" } },
            { vendorName: { contains: q, mode: "insensitive" } },
            { asset: { name: { contains: q, mode: "insensitive" } } },
            { asset: { ain: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [records, totalCount, assets, totalRecords, openFlags, criticalFlags, latestFlags] = await Promise.all([
    db.maintenanceRecord.findMany({
      where,
      include: {
        asset: true,
        documents: { select: { id: true, fileName: true, displayName: true, fileUrl: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { serviceDate: "desc" },
      skip,
      take,
    }),
    db.maintenanceRecord.count({ where }),
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
  const assetOptions = assets.map((asset) => ({ id: asset.id, label: `${asset.name} (${asset.ain})` }));

  return (
    <div>
      <PageHeader
        title="Status and Maintenance"
        description="Lifecycle flow from purchased through disposal with service history."
        action={canWrite ? <MaintenancePageActions assets={assetOptions} /> : null}
      />
      <MaintenanceBoard
        totalRecords={totalRecords}
        openFlags={openFlags}
        criticalFlags={criticalFlags}
        latestFlags={latestFlags.map((flag) => ({
          id: flag.id,
          title: flag.title,
          notes: flag.notes,
          severity: flag.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          assetName: flag.asset.name,
        }))}
      />
      <Card className="mt-4 border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar
            searchPlaceholder="Search by asset, description, or vendor"
            filters={<MaintenanceStatusFilter />}
          />
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
              {records.map((record) => (
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
                      documents={record.documents}
                      canUpload={canUpload}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalItems={totalCount} pageSize={pageSize} />
        </CardContent>
      </Card>
    </div>
  );
}
