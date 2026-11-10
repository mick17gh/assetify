"use server";

import { ERROR_MESSAGES, PERMISSION_KEYS } from "@/constants";
import { getRecentAssetsForPicker, searchAssetsForPicker } from "@/lib/assets/picker-search";
import type { PickerOption } from "@/lib/lookups/types";
import { hasPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { getRecentUsersForPicker, searchUsersForPicker } from "@/lib/users/picker-search";
import { getRecentVendorsForPicker, searchVendorsForPicker } from "@/lib/vendors/picker-search";

function canUseLookups(role: Parameters<typeof hasPermission>[0]) {
  return (
    hasPermission(role, PERMISSION_KEYS.ASSET_READ) ||
    hasPermission(role, PERMISSION_KEYS.REPORTS_VIEW) ||
    hasPermission(role, PERMISSION_KEYS.USER_MANAGE) ||
    hasPermission(role, PERMISSION_KEYS.POLICY_MANAGE)
  );
}

export async function getRecentAssetsForPickerAction(limit = 50): Promise<{ options: PickerOption[] }> {
  const session = await getRequiredSession();
  if (!canUseLookups(session.role) || !session.organizationId) throw new Error(ERROR_MESSAGES.FORBIDDEN);
  return {
    options: await getRecentAssetsForPicker({ organizationId: session.organizationId, limit }),
  };
}

export async function searchAssetsForPickerAction(search = ""): Promise<{ options: PickerOption[] }> {
  const session = await getRequiredSession();
  if (!canUseLookups(session.role) || !session.organizationId) throw new Error(ERROR_MESSAGES.FORBIDDEN);
  return {
    options: await searchAssetsForPicker({ organizationId: session.organizationId, search }),
  };
}

export async function getRecentUsersForPickerAction(limit = 50): Promise<{ options: PickerOption[] }> {
  const session = await getRequiredSession();
  if (!canUseLookups(session.role) || !session.organizationId) throw new Error(ERROR_MESSAGES.FORBIDDEN);
  return {
    options: await getRecentUsersForPicker({
      organizationId: session.organizationId,
      branchId: session.branchId,
      limit,
    }),
  };
}

export async function searchUsersForPickerAction(search = ""): Promise<{ options: PickerOption[] }> {
  const session = await getRequiredSession();
  if (!canUseLookups(session.role) || !session.organizationId) throw new Error(ERROR_MESSAGES.FORBIDDEN);
  return {
    options: await searchUsersForPicker({
      organizationId: session.organizationId,
      branchId: session.branchId,
      search,
    }),
  };
}

export async function getRecentVendorsForPickerAction(limit = 50): Promise<{ options: PickerOption[] }> {
  const session = await getRequiredSession();
  if (!canUseLookups(session.role)) throw new Error(ERROR_MESSAGES.FORBIDDEN);
  return { options: await getRecentVendorsForPicker({ limit }) };
}

export async function searchVendorsForPickerAction(search = ""): Promise<{ options: PickerOption[] }> {
  const session = await getRequiredSession();
  if (!canUseLookups(session.role)) throw new Error(ERROR_MESSAGES.FORBIDDEN);
  return { options: await searchVendorsForPicker({ search }) };
}
