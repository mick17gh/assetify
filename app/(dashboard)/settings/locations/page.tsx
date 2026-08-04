import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { LocationsSetupTabs } from "@/components/settings/locations-setup-tabs";
import { PageLoading } from "@/components/shared/page-loading";
import { db } from "@/lib/db";
import { PAGINATION } from "@/constants";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { getRequiredSession } from "@/lib/session";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { Prisma } from "@/lib/generated/prisma/client";

type LocationTab = "departments" | "rooms" | "shelves";

function resolveTab(value: string | undefined): LocationTab {
  if (value === "rooms" || value === "shelves") return value;
  return "departments";
}

async function LocationsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const orgId = session.organizationId ?? undefined;
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const activeTab = resolveTab(getOptionalQuery(params, "tab"));
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params, {
    defaultPageSize: PAGINATION.SETTINGS_DEFAULT_LIMIT,
  });

  const [qrEnabled, branches, roomsForSelect] = await Promise.all([
    orgId ? isQrLocationScanningEnabled(orgId) : Promise.resolve(false),
    db.branch.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    db.room.findMany({
      where: { branch: { organizationId: orgId } },
      include: { branch: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);

  let departments: Array<{ id: string; name: string; branchId: string; branch: { name: string } }> = [];
  let rooms: Array<{ id: string; name: string; branchId: string; branch: { name: string } }> = [];
  let shelves: Array<{ id: string; name: string; roomId: string; room: { name: string } }> = [];
  let totalCount = 0;

  if (activeTab === "departments") {
    const where: Prisma.DepartmentWhereInput = {
      branch: { organizationId: orgId },
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    };
    const [rows, count] = await Promise.all([
      db.department.findMany({
        where,
        include: { branch: true },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      db.department.count({ where }),
    ]);
    departments = rows;
    totalCount = count;
  } else if (activeTab === "rooms") {
    const where: Prisma.RoomWhereInput = {
      branch: { organizationId: orgId },
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    };
    const [rows, count] = await Promise.all([
      db.room.findMany({
        where,
        include: { branch: true },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      db.room.count({ where }),
    ]);
    rooms = rows;
    totalCount = count;
  } else {
    const where: Prisma.ShelfWhereInput = {
      room: { branch: { organizationId: orgId } },
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    };
    const [rows, count] = await Promise.all([
      db.shelf.findMany({
        where,
        include: { room: true },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      db.shelf.count({ where }),
    ]);
    shelves = rows;
    totalCount = count;
  }

  return (
    <SetupTableShell
      searchPlaceholder="Search locations"
      currentPage={page}
      totalItems={totalCount}
      pageSize={pageSize}
    >
      <LocationsSetupTabs
        activeTab={activeTab}
        departments={departments}
        rooms={rooms}
        shelves={shelves}
        branches={branches.map((b) => ({ id: b.id, label: `${b.name} (${b.code})` }))}
        roomsForSelect={roomsForSelect.map((r) => ({ id: r.id, label: `${r.name} (${r.branch.name})` }))}
        qrEnabled={qrEnabled}
      />
    </SetupTableShell>
  );
}

export default function LocationsSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <PageHeader title="Locations" description="Manage departments, rooms, and shelves." />
      <Suspense fallback={<PageLoading rows={6} />}>
        <LocationsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
