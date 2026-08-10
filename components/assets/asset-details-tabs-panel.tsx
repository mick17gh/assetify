import { AssetDetailsTabs } from "@/components/assets/asset-details-tabs";
import { db } from "@/lib/db";
import { getTotalMaintenanceCost, isHighMaintenanceAsset } from "@/lib/maintenance-service";

export async function AssetDetailsTabsPanel({
  assetId,
  purchaseCost,
  thresholdPercent,
  valuation,
  canUploadDocuments,
  overviewBase,
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
  };
}) {
  const [maintenanceRecords, statusHistory, documents, disposalRecord, totalMaintenanceCost] =
    await Promise.all([
      db.maintenanceRecord.findMany({
        where: { assetId },
        orderBy: { serviceDate: "desc" },
        take: 20,
        include: { documents: { select: { id: true, fileName: true, fileUrl: true } } },
      }),
      db.assetStatusHistory.findMany({
        where: { assetId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.assetDocument.findMany({
        where: { assetId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.assetDisposalRecord.findUnique({ where: { assetId } }),
      getTotalMaintenanceCost(assetId),
    ]);

  const highMaintenance = isHighMaintenanceAsset(purchaseCost, totalMaintenanceCost, thresholdPercent);

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
        latestHistory: statusHistory[0]
          ? {
              date: statusHistory[0].createdAt.toLocaleDateString(),
              from: statusHistory[0].fromStatus ?? "N/A",
              to: statusHistory[0].toStatus,
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
      history={statusHistory.map((item) => ({
        id: item.id,
        date: item.createdAt.toLocaleDateString(),
        from: item.fromStatus ?? "N/A",
        to: item.toStatus,
        note: item.note ?? "",
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
      canUploadDocuments={canUploadDocuments}
    />
  );
}
