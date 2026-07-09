export const USER_ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
} as const;

export const PERMISSION_KEYS = {
  ASSET_READ: "asset:read",
  ASSET_WRITE: "asset:write",
  DOCUMENT_READ: "document:read",
  DOCUMENT_WRITE: "document:write",
  LOCATION_UPDATE: "location:update",
  REPORT_READ: "report:read",
  USER_MANAGE: "user:manage",
  POLICY_MANAGE: "policy:manage",
} as const;

export const ROLE_PERMISSIONS: Record<(typeof USER_ROLES)[keyof typeof USER_ROLES], readonly string[]> = {
  ADMIN: Object.values(PERMISSION_KEYS),
  MANAGER: [
    PERMISSION_KEYS.ASSET_READ,
    PERMISSION_KEYS.ASSET_WRITE,
    PERMISSION_KEYS.DOCUMENT_READ,
    PERMISSION_KEYS.DOCUMENT_WRITE,
    PERMISSION_KEYS.LOCATION_UPDATE,
    PERMISSION_KEYS.REPORT_READ,
  ],
  STAFF: [
    PERMISSION_KEYS.ASSET_READ,
    PERMISSION_KEYS.DOCUMENT_READ,
    PERMISSION_KEYS.LOCATION_UPDATE,
  ],
};
