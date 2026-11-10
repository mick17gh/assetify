import { AssetDetailsTabs } from "@/components/assets/asset-details-tabs";
import { db } from "@/lib/db";
import { buildAssetTimeline } from "@/lib/asset-timeline";
import { getTotalMaintenanceCost, isHighMaintenanceAsset } from "@/lib/maintenance-service";

export async function AssetDetailsTabsPanel({
  assetId,
  purchaseCost,
  thresholdPercent,
  valuation,
  canUploadDocuments,
  overviewBase,
  disposalPipeline,
}: {
  assetId: string;
  purchaseCost: number;
  thresholdPercent: number;
  valuation: {
    currentValue: number;
    accumulatedDepreciation: number;
    recommendedSalePrice: number;
  };
  canUploadDocuments: boolean;
  overviewBase: {
    status: string;
    condition: string;
    serialNumber: string;
    manufacturer: string;
    modelName: string;
    existingAssetNumber: string;
    assignmentType: string;
    expectedReturn: string;
    acknowledgement: string;
    category: string;
    branch: string;
    department: string;
    room: string;
    shelf: string;
    custodian: string;
    vendor: string;
    purchaseDate: string;
    purchaseCost: string;
    warrantyExpiry: string;
    poNumber: string;
    invoiceNumber: string;
    invoiceUrl: string;
    capitalizedDate: string;
    ownershipType: string;
    lessorName: string;
    leaseWindow: string;
    leaseMonthlyCost: string;
  };
  disposalPipeline: {
    recommendationState: string | null;
    approvalStatus: string | null;
    recommendedAction: string | null;
    reason: string | null;
    replacementState: string | null;
    recommendedReplaceDate: string | null;
  };
}) {
  const [maintenanceRecords, timeline, documents, disposalRecord, totalMaintenanceCost] = await Promise.all([
    db.maintenanceRecord.findMany({
      where: { assetId },
      orderBy: { serviceDate: "desc" },
      take: 20,
      include: { documents: { select: { id: true, fileName: true, fileUrl: true } } },
    }),
    buildAssetTimeline(assetId, 80),
    db.assetDocument.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.assetDisposalRecord.findUnique({ where: { assetId } }),
    getTotalMaintenanceCost(assetId),
  ]);

  const highMaintenance = isHighMaintenanceAsset(purchaseCost, totalMaintenanceCost, thresholdPercent);
  const statusEvents = timeline.filter((item) => item.kind === "status");

  return (
    <AssetDetailsTabs
      overview={{
        ...overviewBase,
        maintenanceCount: maintenanceRecords.length,
        documentCount: documents.length,
        latestMaintenance: maintenanceRecords[0]
          ? {
              date: maintenanceRecords[0].serviceDate.toLocaleDateString(),
              description: maintenanceRecords[0].description,
            }
          : null,
        latestHistory: statusEvents[0]
          ? {
              date: statusEvents[0].at.toLocaleDateString(),
              from: statusEvents[0].title,
              to: statusEvents[0].detail,
            }
          : null,
        currentValue: valuation.currentValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        accumulatedDepreciation: valuation.accumulatedDepreciation.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        recommendedSalePrice: valuation.recommendedSalePrice.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }}
      maintenance={maintenanceRecords.map((item) => ({
        id: item.id,
        serviceDate: item.serviceDate.toLocaleDateString(),
        description: item.description,
        cost: item.cost
          ? Number(item.cost).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "N/A",
        vendorName: item.vendorName ?? "",
        status: item.status,
        documents: item.documents,
      }))}
      maintenanceSummary={{
        totalCost: totalMaintenanceCost,
        purchaseCost,
        isHighCost: highMaintenance,
      }}
      timeline={timeline.map((item) => ({
        id: item.id,
        at: item.at.toLocaleString(),
        kind: item.kind,
        title: item.title,
        detail: item.detail,
      }))}
      files={documents.map((item) => ({
        id: item.id,
        fileName: item.displayName,
        type: item.documentType,
        fileUrl: item.fileUrl,
        createdAt: item.createdAt.toLocaleDateString(),
      }))}
      disposalRecord={
        disposalRecord
          ? {
              method: disposalRecord.method,
              disposalDate: disposalRecord.disposalDate.toLocaleDateString(),
              reason: disposalRecord.reason,
              salePrice: disposalRecord.salePrice
                ? Number(disposalRecord.salePrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : null,
            }
          : null
      }
      disposalPipeline={disposalPipeline}
      canUploadDocuments={canUploadDocuments}
    />
  );
}
