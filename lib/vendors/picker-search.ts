import { db } from "@/lib/db";
import { PICKER_LIMIT, type PickerOption } from "@/lib/lookups/types";

function toOption(vendor: { id: string; name: string }): PickerOption {
  return { id: vendor.id, label: vendor.name };
}

export async function getRecentVendorsForPicker(input: { limit?: number } = {}): Promise<PickerOption[]> {
  const limit = Math.min(Math.max(input.limit ?? PICKER_LIMIT, 1), PICKER_LIMIT);
  const vendors = await db.vendor.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, name: true },
  });
  return vendors.map(toOption);
}

export async function searchVendorsForPicker(input: {
  search?: string;
  limit?: number;
}): Promise<PickerOption[]> {
  const limit = Math.min(Math.max(input.limit ?? PICKER_LIMIT, 1), PICKER_LIMIT);
  const q = input.search?.trim() ?? "";
  if (!q) return getRecentVendorsForPicker({ limit });

  const vendors = await db.vendor.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true },
  });
  return vendors.map(toOption);
}

export async function getVendorPickerOptionById(id: string): Promise<PickerOption | null> {
  const vendor = await db.vendor.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  return vendor ? toOption(vendor) : null;
}
