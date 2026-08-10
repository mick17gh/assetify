import Link from "next/link";
import { LocationTracker } from "@/components/locations/location-tracker";
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
import { Prisma } from "@/lib/generated/prisma/client";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { Button } from "@/components/ui/button";

export default async function LocationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const qrEnabled = session.organizationId ? await isQrLocationScanningEnabled(session.organizationId) : false;
  const assetScope = getAssetScopeWhere(session);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params);
  const where: Prisma.AssetMovementWhereInput = {
    asset: assetScope,
    ...(q
      ? {
          OR: [
            { note: { contains: q, mode: "insensitive" } },
            { asset: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [rows, totalCount, assets, branches, departments, rooms, shelves, users] = await Promise.all([
    db.assetMovement.findMany({
      where,
      include: { asset: { include: { branch: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.assetMovement.count({ where }),
    db.asset.findMany({
      where: assetScope,
      orderBy: { name: "asc" },
      select: { id: true, name: true, ain: true },
      take: 300,
    }),
    db.branch.findMany({
      where: { organizationId: session.organizationId ?? undefined },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    db.department.findMany({
      where: { branch: { organizationId: session.organizationId ?? undefined } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
    db.room.findMany({
      where: { branch: { organizationId: session.organizationId ?? undefined } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
    db.shelf.findMany({
      where: { room: { branch: { organizationId: session.organizationId ?? undefined } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, roomId: true },
    }),
    db.user.findMany({
      where: { organizationId: session.organizationId ?? undefined, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Location Tracking"
        description="Track last-known location and movement logs with optional QR-assisted scanning."
        action={
          <div className="flex flex-wrap gap-2">
            {qrEnabled ? (
              <Button variant="outline" asChild className="cursor-pointer border-purple-200">
                <Link href="/locations/scan">Scan location</Link>
              </Button>
            ) : null}
            <LocationTracker
              assets={assets.map((asset) => ({ id: asset.id, label: `${asset.name} (${asset.ain})` }))}
              branches={branches.map((branch) => ({ id: branch.id, label: `${branch.name} (${branch.code})` }))}
              departments={departments}
              rooms={rooms}
              shelves={shelves}
              users={users}
            />
          </div>
        }
      />
      <Card className="border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar searchPlaceholder="Filter by movement note or asset" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/assets/${row.assetId}`} prefetch className="font-medium text-[#6D28D9] hover:underline">
                      {row.asset.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.movementType}</TableCell>
                  <TableCell>{row.asset.branch.name}</TableCell>
                  <TableCell>{row.createdAt.toLocaleDateString()}</TableCell>
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
