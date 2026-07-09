import { PageHeader } from "@/components/shared/page-header";
import { SetupTableShell } from "@/components/shared/setup-table-shell";
import { LocationsSetupTabs } from "@/components/settings/locations-setup-tabs";
import { db } from "@/lib/db";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { getRequiredSession } from "@/lib/session";

export default async function LocationsSettingsPage() {
  const session = await getRequiredSession();
  const orgId = session.organizationId ?? undefined;
  const qrEnabled = orgId ? await isQrLocationScanningEnabled(orgId) : false;

  const [departments, rooms, shelves, branches] = await Promise.all([
    db.department.findMany({
      where: { branch: { organizationId: orgId } },
      include: { branch: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    db.room.findMany({
      where: { branch: { organizationId: orgId } },
      include: { branch: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    db.shelf.findMany({
      where: { room: { branch: { organizationId: orgId } } },
      include: { room: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    db.branch.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Locations" description="Manage departments, rooms, and shelves." />
      <SetupTableShell searchPlaceholder="Search locations" defaultLimit={100} nextCursor={null} shownCount={departments.length + rooms.length + shelves.length}>
        <LocationsSetupTabs
          departments={departments}
          rooms={rooms}
          shelves={shelves}
          branches={branches.map((b) => ({ id: b.id, label: `${b.name} (${b.code})` }))}
          roomsForSelect={rooms.map((r) => ({ id: r.id, label: `${r.name} (${r.branch.name})` }))}
          qrEnabled={qrEnabled}
        />
      </SetupTableShell>
    </div>
  );
}
