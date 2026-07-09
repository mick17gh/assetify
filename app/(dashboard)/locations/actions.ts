"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  APP_ROUTES,
  ERROR_MESSAGES,
  MOVEMENT_TYPE,
  PERMISSION_KEYS,
  USER_ROLES,
} from "@/constants";
import { assertPermission, canAccessBranch } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { createMovementSchema } from "@/lib/validation/movement";
import { parseOptionalCuid } from "@/lib/validation/helpers";

export async function createAssetMovementAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.LOCATION_UPDATE);

  const parsed = createMovementSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const asset = await db.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.organizationId ?? undefined },
    include: { room: true, shelf: true },
  });
  if (!asset) throw new Error("Asset not found.");

  if (!canAccessBranch(session.role, session.branchId, asset.branchId)) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }

  const nextBranchId = parseOptionalCuid(parsed.data.toBranchId);
  const nextRoomId = parseOptionalCuid(parsed.data.toRoomId);
  const nextShelfId = parseOptionalCuid(parsed.data.toShelfId);
  const nextCustodianId = parseOptionalCuid(parsed.data.toCustodianId);

  let resolvedBranchId = asset.branchId;
  let resolvedRoomId = asset.roomId;
  let resolvedShelfId = asset.shelfId;
  let resolvedCustodianId = asset.custodianId;

  if (nextBranchId) {
    const branch = await db.branch.findFirst({
      where: { id: nextBranchId, organizationId: session.organizationId ?? undefined },
      select: { id: true },
    });
    if (!branch) throw new Error("Target branch not found.");
    if (!canAccessBranch(session.role, session.branchId, branch.id)) {
      throw new Error(ERROR_MESSAGES.FORBIDDEN);
    }
  }

  if (nextRoomId) {
    const room = await db.room.findFirst({
      where: {
        id: nextRoomId,
        branch: { organizationId: session.organizationId ?? undefined },
      },
      select: { id: true, branchId: true },
    });
    if (!room) throw new Error("Target room not found.");
    resolvedRoomId = room.id;
    resolvedBranchId = room.branchId;
    resolvedShelfId = null;
  }

  if (nextShelfId) {
    const shelf = await db.shelf.findFirst({
      where: {
        id: nextShelfId,
        room: { branch: { organizationId: session.organizationId ?? undefined } },
      },
      select: { id: true, roomId: true, room: { select: { branchId: true } } },
    });
    if (!shelf) throw new Error("Target shelf not found.");
    resolvedShelfId = shelf.id;
    resolvedRoomId = shelf.roomId;
    resolvedBranchId = shelf.room.branchId;
  }

  if (nextCustodianId) {
    const custodian = await db.user.findFirst({
      where: { id: nextCustodianId, organizationId: session.organizationId ?? undefined },
      select: { id: true },
    });
    if (!custodian) throw new Error("Target custodian not found.");
    resolvedCustodianId = custodian.id;
  }

  switch (parsed.data.movementType) {
    case MOVEMENT_TYPE.BRANCH_TRANSFER: {
      if (!nextBranchId) throw new Error("Target branch is required.");
      resolvedBranchId = nextBranchId;
      resolvedRoomId = null;
      resolvedShelfId = null;
      break;
    }
    case MOVEMENT_TYPE.STORAGE_TRANSFER: {
      if (nextBranchId) resolvedBranchId = nextBranchId;
      break;
    }
    case MOVEMENT_TYPE.ROOM_TRANSFER: {
      if (!nextRoomId) throw new Error("Target room is required.");
      break;
    }
    case MOVEMENT_TYPE.SHELF_TRANSFER: {
      if (!nextShelfId) throw new Error("Target shelf is required.");
      break;
    }
    case MOVEMENT_TYPE.STAFF_ASSIGNMENT: {
      if (!nextCustodianId) throw new Error("Target custodian is required.");
      break;
    }
  }

  await db.assetMovement.create({
    data: {
      assetId: asset.id,
      movementType: parsed.data.movementType,
      fromBranchId: asset.branchId,
      toBranchId: resolvedBranchId,
      fromRoomId: asset.roomId,
      toRoomId: resolvedRoomId,
      fromShelfId: asset.shelfId,
      toShelfId: resolvedShelfId,
      fromCustodianId: asset.custodianId,
      toCustodianId: resolvedCustodianId,
      note: parsed.data.note?.trim() || null,
      movedByUserId: session.userId,
    },
  });

  await db.asset.update({
    where: { id: asset.id },
    data: {
      branchId: resolvedBranchId,
      roomId: resolvedRoomId,
      shelfId: resolvedShelfId,
      custodianId: resolvedCustodianId,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.role === USER_ROLES.ADMIN ? resolvedBranchId : session.branchId,
    action: "asset.movement.create",
    entityType: "AssetMovement",
    entityId: asset.id,
    metadata: { movementType: parsed.data.movementType },
  });

  revalidatePath(APP_ROUTES.LOCATIONS);
  revalidatePath(`/assets/${asset.id}`);
}
