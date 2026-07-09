import { db } from "@/lib/db";
import { createMaintenanceSchema } from "@/lib/validation/maintenance";
import { createMovementSchema } from "@/lib/validation/movement";
import { updateAssetSchema } from "@/lib/validation/asset";
import { parseOptionalCuid } from "@/lib/validation/helpers";
import { syncReplacementForAsset } from "@/lib/replacement-service";
import { syncRemindersForAsset } from "@/lib/reminder-service";

export type OfflineOperation = {
  type: string;
  payload: Record<string, unknown>;
};

type ReplayContext = {
  organizationId: string;
  userId: string;
};

export async function replayOfflineOperations(operations: OfflineOperation[], context: ReplayContext) {
  const results: Array<{ type: string; ok: boolean; error?: string }> = [];

  for (const op of operations) {
    try {
      switch (op.type) {
        case "movement.create": {
          const parsed = createMovementSchema.safeParse(op.payload);
          if (!parsed.success) throw new Error("Invalid movement payload");

          const asset = await db.asset.findFirst({
            where: { id: parsed.data.assetId, organizationId: context.organizationId },
            select: {
              id: true,
              branchId: true,
              roomId: true,
              shelfId: true,
              custodianId: true,
            },
          });
          if (!asset) throw new Error("Asset not found");

          await db.assetMovement.create({
            data: {
              assetId: asset.id,
              fromBranchId: asset.branchId,
              toBranchId: parseOptionalCuid(parsed.data.toBranchId),
              fromRoomId: asset.roomId,
              toRoomId: parseOptionalCuid(parsed.data.toRoomId),
              fromShelfId: asset.shelfId,
              toShelfId: parseOptionalCuid(parsed.data.toShelfId),
              fromCustodianId: asset.custodianId,
              toCustodianId: parseOptionalCuid(parsed.data.toCustodianId),
              movementType: parsed.data.movementType,
              note: parsed.data.note,
              movedByUserId: context.userId,
            },
          });
          await db.asset.update({
            where: { id: asset.id },
            data: {
              branchId: parseOptionalCuid(parsed.data.toBranchId) ?? asset.branchId,
              roomId: parseOptionalCuid(parsed.data.toRoomId),
              shelfId: parseOptionalCuid(parsed.data.toShelfId),
              custodianId: parseOptionalCuid(parsed.data.toCustodianId),
            },
          });
          results.push({ type: op.type, ok: true });
          break;
        }
        case "maintenance.create": {
          const parsed = createMaintenanceSchema.safeParse(op.payload);
          if (!parsed.success) throw new Error("Invalid maintenance payload");

          const asset = await db.asset.findFirst({
            where: { id: parsed.data.assetId, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!asset) throw new Error("Asset not found");

          await db.maintenanceRecord.create({
            data: {
              assetId: asset.id,
              description: parsed.data.description,
              serviceDate: new Date(parsed.data.serviceDate),
              cost: parsed.data.cost ? parsed.data.cost : null,
              vendorName: parsed.data.vendorName?.trim() || null,
              nextServiceDate: parsed.data.nextServiceDate ? new Date(parsed.data.nextServiceDate) : null,
            },
          });
          results.push({ type: op.type, ok: true });
          break;
        }
        case "asset.profile.update":
        case "asset.update": {
          const parsed = updateAssetSchema.safeParse(op.payload);
          if (!parsed.success) throw new Error("Invalid asset profile payload");

          const update = await db.asset.updateMany({
            where: {
              id: parsed.data.assetId,
              organizationId: context.organizationId,
            },
            data: {
              name: parsed.data.name,
              description: parsed.data.description?.trim() || null,
              categoryId: parsed.data.categoryId,
              branchId: parsed.data.branchId,
              departmentId: parseOptionalCuid(parsed.data.departmentId),
              roomId: parseOptionalCuid(parsed.data.roomId),
              shelfId: parseOptionalCuid(parsed.data.shelfId),
              vendorId: parseOptionalCuid(parsed.data.vendorId),
              custodianId: parseOptionalCuid(parsed.data.custodianId),
              purchaseCost: parsed.data.purchaseCost,
              warrantyExpiryDate: parsed.data.warrantyExpiryDate ? new Date(parsed.data.warrantyExpiryDate) : null,
            },
          });
          if (update.count === 0) throw new Error("Asset not found");
          await syncReplacementForAsset(parsed.data.assetId);
          await syncRemindersForAsset(parsed.data.assetId);
          results.push({ type: op.type, ok: true });
          break;
        }
        default:
          results.push({ type: op.type, ok: false, error: "Unsupported operation type" });
      }
    } catch (error) {
      results.push({
        type: op.type,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
