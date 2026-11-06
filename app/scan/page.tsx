import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetMovementForm } from "@/components/scan/asset-movement-form";
import { CampaignVerifyPanel } from "@/components/campaigns/campaign-verify-panel";
import { AssetScanHistories } from "@/components/scan/asset-scan-histories";
import { AssetScanProfileCard } from "@/components/scan/asset-scan-profile";
import { BrandWordmark } from "@/components/shared/brand-wordmark";
import { Button } from "@/components/ui/button";
import { APP_ROUTES, PERMISSION_KEYS } from "@/constants";
import { hasPermission } from "@/lib/permissions";
import { listScanPrompts } from "@/lib/campaign-service";
import { loadAssetScanPageData } from "@/lib/qr/asset-scan-profile";
import { parseQrScanValue, type QrLocationType } from "@/lib/qr/payload";
import { getOptionalSession } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickOne(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function ScanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const scanAsset = pickOne(params.asset);
  if (!scanAsset) notFound();

  const parsedAsset = parseQrScanValue(scanAsset);
  if (parsedAsset?.kind !== "asset") notFound();

  const scanLocationType = pickOne(params.locationType);
  const scanLocationId = pickOne(params.locationId);
  let initialLocationType: QrLocationType | undefined;
  let initialLocationId: string | undefined;

  if (scanLocationType && scanLocationId) {
    const parsedLocation = parseQrScanValue(`/scan?locationType=${scanLocationType}&locationId=${scanLocationId}`);
    if (parsedLocation?.kind === "location") {
      initialLocationType = parsedLocation.locationType;
      initialLocationId = parsedLocation.locationId;
    }
  }

  const session = await getOptionalSession();
  const canRecordMovement = session ? hasPermission(session.role, PERMISSION_KEYS.LOCATION_UPDATE) : false;

  const data = await loadAssetScanPageData(parsedAsset.assetId, session, {
    includeMovementForm: canRecordMovement,
  });
  if (!data) notFound();

  const prompts =
    session && hasPermission(session.role, PERMISSION_KEYS.ASSET_WRITE)
      ? await listScanPrompts(session, data.profile.id)
      : [];

  const redirectTo = `${APP_ROUTES.SCAN}?asset=${encodeURIComponent(parsedAsset.assetId)}`;
  const signInHref = `${APP_ROUTES.SIGN_IN}?redirectTo=${encodeURIComponent(redirectTo)}`;
  const showMovementForm = canRecordMovement && data.movementFormOptions;

  return (
    <div className="min-h-screen bg-navy-50 p-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-4">
          <BrandWordmark />
          {!session ? (
            <Link href={signInHref} className="text-sm text-navy-700 underline underline-offset-2 hover:text-navy-900">
              Sign in to record a movement
            </Link>
          ) : null}
        </div>

        <div className="space-y-5">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Asset scan</h1>
            <p className="mt-1 text-sm text-navy-900/70">
              {showMovementForm
                ? "Review this asset and record a movement update."
                : "View-only asset profile from QR tag scan."}
            </p>
          </header>

          <AssetScanProfileCard profile={data.profile} variant={showMovementForm ? "compact" : "full"} />

          {prompts.map((campaign) => (
            <CampaignVerifyPanel
              key={campaign.id}
              campaignId={campaign.id}
              campaignName={campaign.name}
              assetId={data.profile.id}
            />
          ))}

          {showMovementForm && data.movementFormOptions ? (
            <>
              {session && hasPermission(session.role, PERMISSION_KEYS.ASSET_READ) ? (
                <div className="flex justify-end">
                  <Button variant="outline" asChild className="cursor-pointer border-navy-200">
                    <Link href={`${APP_ROUTES.ASSETS}/${data.profile.id}`}>View full asset details</Link>
                  </Button>
                </div>
              ) : null}
              <AssetMovementForm
                assetId={data.profile.id}
                assetLabel={`${data.profile.name} (${data.profile.ain})`}
                options={data.movementFormOptions}
                initialLocationType={initialLocationType}
                initialLocationId={initialLocationId}
                redirectTo={redirectTo}
                title="Record movement"
                showAssetSelect={false}
              />
            </>
          ) : (
            <>
              <AssetScanHistories movements={data.movements} statusHistory={data.statusHistory} />
              {!session ? (
                <div className="rounded-lg border border-navy-200 bg-white p-4 text-center text-sm text-navy-900/80">
                  <p className="mb-3">Sign in with a staff account to record location movements for this asset.</p>
                  <Button asChild className="cursor-pointer bg-navy-900 hover:bg-navy-950">
                    <Link href={signInHref}>Sign in</Link>
                  </Button>
                </div>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Your account does not have permission to record movements. Contact an administrator if you need access.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
