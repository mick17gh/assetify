import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailTabsLoading } from "@/components/shared/detail-page-loading";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssetDetailsTabsPanel } from "@/components/assets/asset-details-tabs-panel";
import { AssetDetailsActions } from "@/components/assets/asset-details-actions";
import { PrintAssetTagButton } from "@/components/assets/print-asset-tag-button";
import { AssetQrPreview } from "@/components/assets/asset-qr-preview";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { calculateAssetValuation } from "@/lib/depreciation-service";
import { hasPermission } from "@/lib/permissions";
import { APP_ROUTES, PERMISSION_KEYS } from "@/constants";

export default async function AssetDetailsPage({ params }: { params: Promise<{ assetId: string }> }) {
  const [{ assetId }, session] = await Promise.all([params, getRequiredSession()]);
  const canUploadDocuments = hasPermission(session.role, PERMISSION_KEYS.DOCUMENT_WRITE);
  const scope = getAssetScopeWhere(session);

  const [asset, qrEnabled] = await Promise.all([
    db.asset.findFirst({
      where: {
        id: assetId,
        ...scope,
      },
      include: {
        branch: true,
        department: true,
        room: true,
        shelf: true,
        vendor: true,
        custodian: true,
        category: true,
        organization: { select: { maintenanceCostThresholdPercent: true } },
        photos: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    session.organizationId ? isQrLocationScanningEnabled(session.organizationId) : Promise.resolve(false),
  ]);

  if (!asset) notFound();

  const depreciationPolicy = await db.depreciationPolicy.findFirst({
    where: {
      organizationId: session.organizationId ?? undefined,
      categoryId: asset.categoryId,
    },
  });

  const valuation = calculateAssetValuation(
    {
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      categoryName: asset.category.name,
      depreciationUsefulLifeYears: asset.depreciationUsefulLifeYears,
      depreciationSalvageValue: asset.depreciationSalvageValue,
      depreciationMethodOverride: asset.depreciationMethodOverride,
    },
    depreciationPolicy
      ? {
          method: depreciationPolicy.method,
          usefulLifeYears: depreciationPolicy.usefulLifeYears,
          salvagePercent: Number(depreciationPolicy.salvagePercent),
        }
      : null,
  );

  const overviewBase = {
    status: asset.status,
    condition: asset.condition,
    serialNumber: asset.serialNumber,
    category: asset.category.name,
    branch: asset.branch.name,
    department: asset.department?.name ?? "N/A",
    room: asset.room?.name ?? "N/A",
    shelf: asset.shelf?.name ?? "N/A",
    custodian: asset.custodian?.name ?? "Unassigned",
    vendor: asset.vendor?.name ?? "N/A",
    purchaseDate: asset.purchaseDate.toLocaleDateString(),
    purchaseCost: Number(asset.purchaseCost).toLocaleString(),
    warrantyExpiry: asset.warrantyExpiryDate ? asset.warrantyExpiryDate.toLocaleDateString() : "N/A",
  };

  return (
    <div>
      <div className="mb-3">
        <Button variant="ghost" asChild className="cursor-pointer px-0 text-purple-800 hover:bg-transparent">
          <Link href={APP_ROUTES.ASSETS} prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Asset Details"
        description={`Comprehensive profile for ${asset.name} (${asset.ain})`}
        action={
          <div className="flex flex-wrap gap-2">
            {qrEnabled ? <PrintAssetTagButton assetId={asset.id} /> : null}
            <AssetDetailsActions
              assetId={asset.id}
              initialName={asset.name}
              initialDescription={asset.description ?? ""}
              initialStatus={asset.status}
              initialCondition={asset.condition}
              recommendedSalePrice={valuation.recommendedSalePrice}
              depreciationUsefulLifeYears={asset.depreciationUsefulLifeYears ? String(asset.depreciationUsefulLifeYears) : ""}
              depreciationSalvageValue={asset.depreciationSalvageValue ? String(asset.depreciationSalvageValue) : ""}
              depreciationMethodOverride={asset.depreciationMethodOverride ?? ""}
            />
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-5">
          <Card className="border-purple-200 shadow-sm">
            <CardContent className="grid gap-5 pt-6 md:grid-cols-[260px_1fr]">
              <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">
                {asset.photos[0]?.url ? (
                  <Image
                    src={asset.photos[0].url}
                    alt={`${asset.name} photo`}
                    width={400}
                    height={170}
                    className="h-[170px] w-full rounded-lg border border-purple-100 object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-[170px] items-center justify-center rounded-lg border border-purple-100 bg-white text-sm text-purple-900/55">
                    No photo uploaded
                  </div>
                )}
                <div className="mt-3">
                  <p className="font-semibold text-purple-950">{asset.name}</p>
                  <p className="text-sm text-purple-900/65">{asset.serialNumber}</p>
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{asset.status}</Badge>
                  <Badge variant="secondary">{asset.condition}</Badge>
                </div>
                <p className="text-sm text-purple-900/75">
                  {asset.description || "No description provided for this asset yet."}
                </p>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-lg border border-purple-100 bg-white p-3">
                    <p className="text-xs text-purple-900/60">Category</p>
                    <p className="font-medium text-purple-950">{asset.category.name}</p>
                  </div>
                  <div className="rounded-lg border border-purple-100 bg-white p-3">
                    <p className="text-xs text-purple-900/60">Purchase Cost</p>
                    <p className="font-medium text-purple-950">{Number(asset.purchaseCost).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-purple-100 bg-white p-3">
                    <p className="text-xs text-purple-900/60">Current Value</p>
                    <p className="font-medium text-purple-950">GHS {valuation.currentValue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-purple-100 bg-white p-3">
                    <p className="text-xs text-purple-900/60">Recommended Sale Price</p>
                    <p className="font-medium text-purple-950">GHS {valuation.recommendedSalePrice.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-purple-100 bg-white p-3">
                    <p className="text-xs text-purple-900/60">Age</p>
                    <p className="font-medium text-purple-950">{valuation.ageMonths} months</p>
                  </div>
                  <div className="rounded-lg border border-purple-100 bg-white p-3">
                    <p className="text-xs text-purple-900/60">Depreciation Applied</p>
                    <p className="font-medium text-purple-950">GHS {valuation.accumulatedDepreciation.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Suspense fallback={<DetailTabsLoading />}>
            <AssetDetailsTabsPanel
              assetId={asset.id}
              purchaseCost={Number(asset.purchaseCost)}
              thresholdPercent={asset.organization.maintenanceCostThresholdPercent}
              valuation={{
                currentValue: valuation.currentValue,
                accumulatedDepreciation: valuation.accumulatedDepreciation,
                recommendedSalePrice: valuation.recommendedSalePrice,
              }}
              canUploadDocuments={canUploadDocuments}
              overviewBase={overviewBase}
            />
          </Suspense>
        </div>

        <Card className="h-fit border-purple-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-purple-950">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {qrEnabled ? <AssetQrPreview assetId={asset.id} ain={asset.ain} branchName={asset.branch.name} /> : null}
            <Spec label="AIN" value={asset.ain} />
            <Spec label="Branch" value={asset.branch.name} />
            <Spec label="Department" value={asset.department?.name ?? "N/A"} />
            <Spec label="Location" value={`${asset.room?.name ?? "N/A"} / ${asset.shelf?.name ?? "N/A"}`} />
            <Spec label="Vendor" value={asset.vendor?.name ?? "N/A"} />
            <Spec label="Custodian" value={asset.custodian?.name ?? "Unassigned"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 rounded-lg border border-purple-100 bg-white p-2.5">
      <p className="text-xs text-purple-900/60">{label}</p>
      <p className="font-medium text-purple-950">{value}</p>
    </div>
  );
}
