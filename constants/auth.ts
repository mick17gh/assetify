export const USER_ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  FINANCE: "FINANCE",
} as const;

export const REPORT_PERMISSION_KEYS = {
  VIEW: "reports:view",
  GENERATE: "reports:generate",
  EXPORT: "reports:export",
} as const;

export const REPORT_IDS_FOR_PERMISSIONS = [
  "executive-asset-overview",
  "asset-register-portfolio",
  "accountability-movement",
  "physical-verification",
  "condition-maintenance-warranty",
  "lifecycle-replacement-disposal",
  "exceptions-risk",
  "management-maturity",
  "asset-audit-trail",
  "system-security-audit",
  "depreciation-period-gl",
] as const;

export const PERMISSION_KEYS = {
  ASSET_READ: "asset:read",
  ASSET_WRITE: "asset:write",
  ASSET_REQUEST: "asset:request",
  ASSET_APPROVE: "asset:approve",
  DOCUMENT_READ: "document:read",
  DOCUMENT_WRITE: "document:write",
  LOCATION_UPDATE: "location:update",
  REPORT_READ: "report:read",
  REPORTS_VIEW: REPORT_PERMISSION_KEYS.VIEW,
  REPORTS_GENERATE: REPORT_PERMISSION_KEYS.GENERATE,
  REPORTS_EXPORT: REPORT_PERMISSION_KEYS.EXPORT,
  FINANCE_READ: "finance:read",
  USER_MANAGE: "user:manage",
  POLICY_MANAGE: "policy:manage",
} as const;

const ALL_REPORT_PERMS = REPORT_IDS_FOR_PERMISSIONS.map((id) => `reports:${id}`);
const MANAGER_REPORT_PERMS = REPORT_IDS_FOR_PERMISSIONS.filter((id) => id !== "system-security-audit").map(
  (id) => `reports:${id}`,
);
const FINANCE_REPORT_PERMS = [
  "executive-asset-overview",
  "asset-register-portfolio",
  "condition-maintenance-warranty",
  "lifecycle-replacement-disposal",
  "exceptions-risk",
  "depreciation-period-gl",
].map((id) => `reports:${id}`);

export const ROLE_PERMISSIONS: Record<(typeof USER_ROLES)[keyof typeof USER_ROLES], readonly string[]> = {
  ADMIN: [...Object.values(PERMISSION_KEYS), ...ALL_REPORT_PERMS],
  MANAGER: [
    PERMISSION_KEYS.ASSET_READ,
    PERMISSION_KEYS.ASSET_WRITE,
    PERMISSION_KEYS.ASSET_APPROVE,
    PERMISSION_KEYS.DOCUMENT_READ,
    PERMISSION_KEYS.DOCUMENT_WRITE,
    PERMISSION_KEYS.LOCATION_UPDATE,
    PERMISSION_KEYS.REPORT_READ,
    PERMISSION_KEYS.REPORTS_VIEW,
    PERMISSION_KEYS.REPORTS_GENERATE,
    PERMISSION_KEYS.REPORTS_EXPORT,
    ...MANAGER_REPORT_PERMS,
  ],
  STAFF: [
    PERMISSION_KEYS.ASSET_READ,
    PERMISSION_KEYS.ASSET_REQUEST,
    PERMISSION_KEYS.DOCUMENT_READ,
    PERMISSION_KEYS.LOCATION_UPDATE,
  ],
  FINANCE: [
    PERMISSION_KEYS.ASSET_READ,
    PERMISSION_KEYS.DOCUMENT_READ,
    PERMISSION_KEYS.REPORT_READ,
    PERMISSION_KEYS.REPORTS_VIEW,
    PERMISSION_KEYS.REPORTS_GENERATE,
    PERMISSION_KEYS.REPORTS_EXPORT,
    PERMISSION_KEYS.FINANCE_READ,
    ...FINANCE_REPORT_PERMS,
  ],
};
