import { PERMISSION_KEYS, ROLE_PERMISSIONS, USER_ROLES } from "@/constants";

export type Role = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export function hasPermission(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertPermission(role: Role, permission: PermissionKey): void {
  if (!hasPermission(role, permission)) {
    throw new Error("FORBIDDEN");
  }
}

export function canAccessBranch(
  role: Role,
  userBranchId: string | null | undefined,
  targetBranchId: string,
): boolean {
  if (role === USER_ROLES.ADMIN) return true;
  return Boolean(userBranchId && userBranchId === targetBranchId);
}
