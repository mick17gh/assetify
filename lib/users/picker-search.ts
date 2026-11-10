import { db } from "@/lib/db";
import { PICKER_LIMIT, type PickerOption } from "@/lib/lookups/types";

function toOption(user: { id: string; name: string; email: string }): PickerOption {
  return { id: user.id, label: `${user.name} (${user.email})`, subtitle: user.email };
}

export async function getRecentUsersForPicker(input: {
  organizationId: string;
  branchId?: string | null;
  limit?: number;
}): Promise<PickerOption[]> {
  const limit = Math.min(Math.max(input.limit ?? PICKER_LIMIT, 1), PICKER_LIMIT);
  const users = await db.user.findMany({
    where: {
      organizationId: input.organizationId,
      isActive: true,
      ...(input.branchId ? { OR: [{ branchId: input.branchId }, { branchId: null }] } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, name: true, email: true },
  });
  return users.map(toOption);
}

export async function searchUsersForPicker(input: {
  organizationId: string;
  search?: string;
  branchId?: string | null;
  limit?: number;
}): Promise<PickerOption[]> {
  const limit = Math.min(Math.max(input.limit ?? PICKER_LIMIT, 1), PICKER_LIMIT);
  const q = input.search?.trim() ?? "";
  if (!q) {
    return getRecentUsersForPicker({
      organizationId: input.organizationId,
      branchId: input.branchId,
      limit,
    });
  }

  const users = await db.user.findMany({
    where: {
      organizationId: input.organizationId,
      isActive: true,
      ...(input.branchId ? { OR: [{ branchId: input.branchId }, { branchId: null }] } : {}),
      AND: [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true, email: true },
  });
  return users.map(toOption);
}

export async function getUserPickerOptionById(id: string): Promise<PickerOption | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  return user ? toOption(user) : null;
}
