import { notFound, redirect } from "next/navigation";
import { QrLocationScanner } from "@/components/locations/qr-location-scanner";
import { PageHeader } from "@/components/shared/page-header";
import { APP_ROUTES, PERMISSION_KEYS } from "@/constants";
import { hasPermission } from "@/lib/permissions";
import { loadMovementFormOptionsForSession } from "@/lib/qr/asset-scan-profile";
import { parseQrScanValue } from "@/lib/qr/payload";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { getRequiredSession } from "@/lib/session";

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

  if (!hasPermission(session.role, PERMISSION_KEYS.LOCATION_UPDATE)) {
    notFound();
  }

  const params = await searchParams;
  const scanAsset = pickOne(params.asset);
  const scanLocationType = pickOne(params.locationType);
  const scanLocationId = pickOne(params.locationId);

  if (scanAsset) {
    const query = new URLSearchParams({ asset: scanAsset });
    if (scanLocationType) query.set("locationType", scanLocationType);
    if (scanLocationId) query.set("locationId", scanLocationId);
    redirect(`${APP_ROUTES.SCAN}?${query.toString()}`);
  }

  let initialLocationType: "branch" | "room" | "shelf" | undefined;
  let initialLocationId: string | undefined;

  if (scanLocationType && scanLocationId) {
    const parsed = parseQrScanValue(`/locations/scan?locationType=${scanLocationType}&locationId=${scanLocationId}`);
    if (parsed?.kind === "location") {
      initialLocationType = parsed.locationType;
      initialLocationId = parsed.locationId;
    }
  }

  const movementFormOptions = await loadMovementFormOptionsForSession(session);
  if (!movementFormOptions) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title="QR Location Scan" description="Scan asset and location tags, then confirm movement updates." />
      <QrLocationScanner
        options={movementFormOptions}
        initialLocationType={initialLocationType}
        initialLocationId={initialLocationId}
      />
    </div>
  );
}
