import { ENUM_LABELS } from "@/constants/labels";
import { db } from "@/lib/db";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { getAssetScopeWhere } from "@/lib/scoping";
import type { AppSession } from "@/lib/session";

export type AssetScanProfile = {
  id: string;
  name: string;
  ain: string;
  serialNumber: string;
  status: string;
  condition: string;
  category: string;
  branch: string;
  department: string;
  room: string;
  shelf: string;
  custodian: string;
  photoUrl: string | null;
  warrantyExpiry: string;
};

export type MovementHistoryItem = {
  id: string;
  date: string;
  movementType: string;
  from: string;
  to: string;
  note: string;
};

export type StatusHistoryItem = {
  id: string;
  date: string;
  from: string;
  to: string;
  note: string;
};

export type BranchRoom = { id: string; name: string; branchId: string };
export type RoomShelf = { id: string; name: string; roomId: string };
export type BranchUser = { id: string; name: string; branchId: string | null };
export type ReferenceOption = { id: string; label: string };

export type MovementFormOptions = {
  assets: ReferenceOption[];
  branches: ReferenceOption[];
  rooms: BranchRoom[];
  shelves: RoomShelf[];
  users: BranchUser[];
};

export type AssetScanPageData = {
  profile: AssetScanProfile;
  movements: MovementHistoryItem[];
  statusHistory: StatusHistoryItem[];
  movementFormOptions: MovementFormOptions | null;
};

type LocationMaps = {
  branches: Map<string, string>;
  rooms: Map<string, string>;
  shelves: Map<string, string>;
};

function labelEnum(labelKey: string, value: string): string {
  return ENUM_LABELS[labelKey]?.[value] ?? value;
}

function formatLocation(
  branchId: string | null | undefined,
  roomId: string | null | undefined,
  shelfId: string | null | undefined,
  maps: LocationMaps,
): string {
  const parts: string[] = [];
  if (branchId && maps.branches.has(branchId)) parts.push(maps.branches.get(branchId)!);
  if (roomId && maps.rooms.has(roomId)) parts.push(maps.rooms.get(roomId)!);
  if (shelfId && maps.shelves.has(shelfId)) parts.push(maps.shelves.get(shelfId)!);
  return parts.length ? parts.join(" / ") : "N/A";
}

async function loadLocationMaps(organizationId: string): Promise<LocationMaps> {
  const [branches, rooms, shelves] = await Promise.all([
    db.branch.findMany({ where: { organizationId }, select: { id: true, name: true } }),
    db.room.findMany({
      where: { branch: { organizationId } },
      select: { id: true, name: true },
    }),
    db.shelf.findMany({
      where: { room: { branch: { organizationId } } },
      select: { id: true, name: true },
    }),
  ]);

  return {
    branches: new Map(branches.map((item) => [item.id, item.name])),
    rooms: new Map(rooms.map((item) => [item.id, item.name])),
    shelves: new Map(shelves.map((item) => [item.id, item.name])),
  };
}

async function loadMovementFormOptions(
  organizationId: string,
  session: AppSession,
  asset: { id: string; name: string; ain: string },
): Promise<MovementFormOptions> {
  const assetScope = getAssetScopeWhere(session);
  const [assets, branches, rooms, shelves, users] = await Promise.all([
    db.asset.findMany({
      where: assetScope,
      orderBy: { name: "asc" },
      select: { id: true, name: true, ain: true },
      take: 500,
    }),
    db.branch.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    db.room.findMany({
      where: { branch: { organizationId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
    db.shelf.findMany({
      where: { room: { branch: { organizationId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, roomId: true },
    }),
    db.user.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
  ]);

  const assetOptions = assets.some((item) => item.id === asset.id)
    ? assets.map((item) => ({ id: item.id, label: `${item.name} (${item.ain})` }))
    : [{ id: asset.id, label: `${asset.name} (${asset.ain})` }, ...assets.map((item) => ({ id: item.id, label: `${item.name} (${item.ain})` }))];

  return {
    assets: assetOptions,
    branches: branches.map((branch) => ({ id: branch.id, label: `${branch.name} (${branch.code})` })),
    rooms,
    shelves,
    users,
  };
}

export async function loadMovementFormOptionsForSession(session: AppSession): Promise<MovementFormOptions | null> {
  if (!session.organizationId) return null;

  const assetScope = getAssetScopeWhere(session);
  const firstAsset = await db.asset.findFirst({
    where: assetScope,
    select: { id: true, name: true, ain: true },
  });
  if (!firstAsset) return null;

  return loadMovementFormOptions(session.organizationId, session, firstAsset);
}

export async function loadAssetScanPageData(
  assetId: string,
  session: AppSession | null,
  options?: { includeMovementForm?: boolean },
): Promise<AssetScanPageData | null> {
  const guestWhere = { id: assetId };
  const authWhere = session
    ? { id: assetId, ...getAssetScopeWhere(session) }
    : guestWhere;

  const asset = await db.asset.findFirst({
    where: session ? authWhere : guestWhere,
    include: {
      branch: true,
      department: true,
      room: true,
      shelf: true,
      category: true,
      custodian: true,
      photos: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!asset) return null;

  const qrEnabled = await isQrLocationScanningEnabled(asset.organizationId);
  if (!qrEnabled) return null;

  const locationMaps = await loadLocationMaps(asset.organizationId);

  const [movements, statusHistory] = await Promise.all([
    db.assetMovement.findMany({
      where: { assetId: asset.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.assetStatusHistory.findMany({
      where: { assetId: asset.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const profile: AssetScanProfile = {
    id: asset.id,
    name: asset.name,
    ain: asset.ain,
    serialNumber: asset.serialNumber,
    status: labelEnum("assetStatus", asset.status),
    condition: labelEnum("assetCondition", asset.condition),
    category: asset.category.name,
    branch: asset.branch.name,
    department: asset.department?.name ?? "N/A",
    room: asset.room?.name ?? "N/A",
    shelf: asset.shelf?.name ?? "N/A",
    custodian: asset.custodian?.name ?? "Unassigned",
    photoUrl: asset.photos[0]?.url ?? null,
    warrantyExpiry: asset.warrantyExpiryDate ? asset.warrantyExpiryDate.toLocaleDateString() : "N/A",
  };

  const movementFormOptions =
    session && options?.includeMovementForm
      ? await loadMovementFormOptions(asset.organizationId, session, asset)
      : null;

  return {
    profile,
    movements: movements.map((item) => ({
      id: item.id,
      date: item.createdAt.toLocaleDateString(),
      movementType: labelEnum("movementType", item.movementType),
      from: formatLocation(item.fromBranchId, item.fromRoomId, item.fromShelfId, locationMaps),
      to: formatLocation(item.toBranchId, item.toRoomId, item.toShelfId, locationMaps),
      note: item.note ?? "",
    })),
    statusHistory: statusHistory.map((item) => ({
      id: item.id,
      date: item.createdAt.toLocaleDateString(),
      from: item.fromStatus ? labelEnum("assetStatus", item.fromStatus) : "N/A",
      to: labelEnum("assetStatus", item.toStatus),
      note: item.note ?? "",
    })),
    movementFormOptions,
  };
}
