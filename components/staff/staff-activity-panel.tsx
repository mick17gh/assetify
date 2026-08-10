import { StaffDetailsTabs } from "@/components/staff/staff-details-tabs";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function StaffActivityPanel({
  userId,
  assetIds,
  assetScope,
  allocatedAssets,
}: {
  userId: string;
  assetIds: string[];
  assetScope: Prisma.AssetWhereInput;
  allocatedAssets: Array<{
    id: string;
    ain: string;
    name: string;
    status: string;
    branch: string;
    location: string;
  }>;
}) {
  const [movements, statusHistory] = await Promise.all([
    db.assetMovement.findMany({
      where: {
        OR: [
          { toCustodianId: userId },
          { fromCustodianId: userId },
          ...(assetIds.length ? [{ assetId: { in: assetIds } }] : []),
        ],
        asset: assetScope,
      },
      include: { asset: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    assetIds.length
      ? db.assetStatusHistory.findMany({
          where: { assetId: { in: assetIds } },
          include: { asset: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
  ]);

  return (
    <StaffDetailsTabs
      allocatedAssets={allocatedAssets}
      movements={movements.map((item) => ({
        id: item.id,
        date: item.createdAt.toLocaleDateString(),
        assetName: item.asset.name,
        assetId: item.asset.id,
        movementType: item.movementType,
        note: item.note ?? "",
      }))}
      history={statusHistory.map((item) => ({
        id: item.id,
        date: item.createdAt.toLocaleDateString(),
        assetName: item.asset.name,
        assetId: item.asset.id,
        from: item.fromStatus ?? "N/A",
        to: item.toStatus,
        note: item.note ?? "",
      }))}
    />
  );
}
