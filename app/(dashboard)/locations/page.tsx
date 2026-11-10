import Link from "next/link";
import { LocationFilters } from "@/components/locations/location-filters";
import { LocationTracker } from "@/components/locations/location-tracker";
import { PageHeader } from "@/components/shared/page-header";
import { getAssetPickerOptionById, getRecentAssetsForPicker } from "@/lib/assets/picker-search";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENUM_LABELS } from "@/constants";
import { Prisma } from "@/lib/generated/prisma/client";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { Button } from "@/components/ui/button";
import { getRecentUsersForPicker } from "@/lib/users/picker-search";

function locationName(map: Map<string, string>, id: string | null) {
  if (!id) return "—";
  return map.get(id) ?? "—";
}

export default async function LocationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const qrEnabled = session.organizationId ? await isQrLocationScanningEnabled(session.organizationId) : false;
  const assetScope = getAssetScopeWhere(session);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const assetId = getOptionalQuery(params, "asset");
  const branchId = getOptionalQuery(params, "branch");
  const departmentId = getOptionalQuery(params, "department");
  const roomId = getOptionalQuery(params, "room");
  const shelfId = getOptionalQuery(params, "shelf");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params);
  const where: Prisma.AssetMovementWhereInput = {
    asset: assetScope,
    ...(assetId ? { assetId } : {}),
    ...(branchId ? { toBranchId: branchId } : {}),
    ...(departmentId ? { toDepartmentId: departmentId } : {}),
    ...(roomId ? { toRoomId: roomId } : {}),
    ...(shelfId ? { toShelfId: shelfId } : {}),
    ...(q
      ? {
          OR: [
            { note: { contains: q, mode: "insensitive" } },
            { asset: { name: { contains: q, mode: "insensitive" } } },
            { asset: { ain: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [rows, totalCount, assetSeed, selectedAsset, userSeed, branches, departments, rooms, shelves] =
    await Promise.all([
      db.assetMovement.findMany({
        where,
        include: { asset: { select: { name: true, ain: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.assetMovement.count({ where }),
      session.organizationId
        ? getRecentAssetsForPicker({ organizationId: session.organizationId })
        : Promise.resolve([]),
      assetId ? getAssetPickerOptionById(assetId) : Promise.resolve(null),
      session.organizationId
        ? getRecentUsersForPicker({ organizationId: session.organizationId, branchId: session.branchId })
        : Promise.resolve([]),
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
    ]);

  const branchById = new Map(branches.map((branch) => [branch.id, branch.name]));
  const departmentById = new Map(departments.map((department) => [department.id, department.name]));
  const roomById = new Map(rooms.map((room) => [room.id, room.name]));
  const shelfById = new Map(shelves.map((shelf) => [shelf.id, shelf.name]));
  const assetSeedWithSelected =
    selectedAsset && !assetSeed.some((item) => item.id === selectedAsset.id)
      ? [selectedAsset, ...assetSeed]
      : assetSeed;

  return (
    <div>
      <PageHeader
        title="Location Tracking"
        description="Track last-known location and movement logs with optional QR-assisted scanning."
        action={
          <div className="flex flex-wrap gap-2">
            {qrEnabled ? (
              <Button variant="outline" asChild className="cursor-pointer border-navy-200">
                <Link href="/locations/scan">Scan location</Link>
              </Button>
            ) : null}
            <LocationTracker
              assetSeed={assetSeed}
              userSeed={userSeed}
              branches={branches.map((branch) => ({ id: branch.id, label: `${branch.name} (${branch.code})` }))}
              departments={departments}
              rooms={rooms}
              shelves={shelves}
            />
          </div>
        }
      />
      <Card className="border-navy-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar
            singleLine
            searchPlaceholder="Search"
            filters={
              <LocationFilters
                assetSeed={assetSeedWithSelected}
                branches={branches.map((branch) => ({ id: branch.id, label: `${branch.name} (${branch.code})` }))}
                departments={departments.map((department) => ({
                  id: department.id,
                  label: department.name,
                  branchId: department.branchId,
                }))}
                rooms={rooms.map((room) => ({ id: room.id, label: room.name, branchId: room.branchId }))}
                shelves={shelves.map((shelf) => ({ id: shelf.id, label: shelf.name, roomId: shelf.roomId }))}
              />
            }
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Shelf</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-navy-900/70">
                    No movements match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/assets/${row.assetId}`} prefetch className="font-medium text-navy-900 hover:underline">
                        {row.asset.name}
                      </Link>
                      <p className="text-xs text-navy-900/55">{row.asset.ain}</p>
                    </TableCell>
                    <TableCell>{ENUM_LABELS.movementType[row.movementType] ?? row.movementType}</TableCell>
                    <TableCell>{locationName(branchById, row.toBranchId)}</TableCell>
                    <TableCell>{locationName(departmentById, row.toDepartmentId)}</TableCell>
                    <TableCell>{locationName(roomById, row.toRoomId)}</TableCell>
                    <TableCell>{locationName(shelfById, row.toShelfId)}</TableCell>
                    <TableCell>{row.createdAt.toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalItems={totalCount} pageSize={pageSize} />
        </CardContent>
      </Card>
    </div>
  );
}
