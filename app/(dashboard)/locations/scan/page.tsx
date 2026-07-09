import { notFound } from "next/navigation";
import { QrLocationScanner } from "@/components/locations/qr-location-scanner";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { parseQrScanValue } from "@/lib/qr/payload";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickOne(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function LocationScanPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getRequiredSession();
  if (!session.organizationId) notFound();

  const qrEnabled = await isQrLocationScanningEnabled(session.organizationId);
  if (!qrEnabled) notFound();

  const params = await searchParams;
  const scanAsset = pickOne(params.asset);
  const scanLocationType = pickOne(params.locationType);
  const scanLocationId = pickOne(params.locationId);

  let initialAssetId: string | undefined;
  let initialLocationType: "branch" | "room" | "shelf" | undefined;
  let initialLocationId: string | undefined;

  if (scanAsset) {
    const parsed = parseQrScanValue(scanAsset);
    if (parsed?.kind === "asset") initialAssetId = parsed.assetId;
  }
  if (scanLocationType && scanLocationId) {
    const parsed = parseQrScanValue(`/locations/scan?locationType=${scanLocationType}&locationId=${scanLocationId}`);
    if (parsed?.kind === "location") {
      initialLocationType = parsed.locationType;
      initialLocationId = parsed.locationId;
    }
  }

  const assetScope = getAssetScopeWhere(session);
  const [assets, branches, rooms, shelves, users] = await Promise.all([
    db.asset.findMany({
      where: assetScope,
      orderBy: { name: "asc" },
      select: { id: true, name: true, ain: true },
      take: 500,
    }),
    db.branch.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    db.room.findMany({
      where: { branch: { organizationId: session.organizationId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
    db.shelf.findMany({
      where: { room: { branch: { organizationId: session.organizationId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, roomId: true },
    }),
    db.user.findMany({
      where: { organizationId: session.organizationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="QR Location Scan" description="Scan asset and location tags, then confirm movement updates." />
      <QrLocationScanner
        assets={assets.map((asset) => ({ id: asset.id, label: `${asset.name} (${asset.ain})` }))}
        branches={branches.map((branch) => ({ id: branch.id, label: `${branch.name} (${branch.code})` }))}
        rooms={rooms}
        shelves={shelves}
        users={users}
        initialAssetId={initialAssetId}
        initialLocationType={initialLocationType}
        initialLocationId={initialLocationId}
      />
    </div>
  );
}
