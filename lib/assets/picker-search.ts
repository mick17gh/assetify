import { db } from "@/lib/db";
import { PICKER_LIMIT, type PickerOption } from "@/lib/lookups/types";

function toOption(asset: { id: string; name: string; ain: string }): PickerOption {
  return { id: asset.id, label: `${asset.name} (${asset.ain})`, subtitle: asset.ain };
}

export async function getRecentAssetsForPicker(input: {
  organizationId: string;
  limit?: number;
}): Promise<PickerOption[]> {
  const limit = Math.min(Math.max(input.limit ?? PICKER_LIMIT, 1), PICKER_LIMIT);
  const assets = await db.asset.findMany({
    where: { organizationId: input.organizationId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, name: true, ain: true },
  });
  return assets.map(toOption);
}

export async function searchAssetsForPicker(input: {
  organizationId: string;
  search?: string;
  limit?: number;
}): Promise<PickerOption[]> {
  const limit = Math.min(Math.max(input.limit ?? PICKER_LIMIT, 1), PICKER_LIMIT);
  const q = input.search?.trim() ?? "";
  if (!q) return getRecentAssetsForPicker({ organizationId: input.organizationId, limit });

  const assets = await db.asset.findMany({
    where: {
      organizationId: input.organizationId,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { ain: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true, ain: true },
  });
  return assets.map(toOption);
}

export async function getAssetPickerOptionById(id: string): Promise<PickerOption | null> {
  const asset = await db.asset.findUnique({
    where: { id },
    select: { id: true, name: true, ain: true },
  });
  return asset ? toOption(asset) : null;
}
