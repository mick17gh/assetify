import { APP_ROUTES, PERMISSION_KEYS } from "@/constants";
import type { PermissionKey } from "@/lib/permissions";

type RouteRule = {
  prefix: string;
  permission: PermissionKey;
};

const ROUTE_RULES: RouteRule[] = [
  { prefix: APP_ROUTES.DASHBOARD, permission: PERMISSION_KEYS.ASSET_READ },
  { prefix: APP_ROUTES.ASSETS, permission: PERMISSION_KEYS.ASSET_READ },
  { prefix: APP_ROUTES.DOCUMENTS, permission: PERMISSION_KEYS.DOCUMENT_READ },
  { prefix: APP_ROUTES.LOCATIONS, permission: PERMISSION_KEYS.LOCATION_UPDATE },
  { prefix: APP_ROUTES.MAINTENANCE, permission: PERMISSION_KEYS.ASSET_READ },
  { prefix: APP_ROUTES.REPLACEMENT, permission: PERMISSION_KEYS.REPORT_READ },
  { prefix: APP_ROUTES.REPORTS, permission: PERMISSION_KEYS.REPORT_READ },
  { prefix: APP_ROUTES.BRANCHES, permission: PERMISSION_KEYS.POLICY_MANAGE },
  { prefix: APP_ROUTES.SETTINGS, permission: PERMISSION_KEYS.POLICY_MANAGE },
  { prefix: APP_ROUTES.USERS, permission: PERMISSION_KEYS.USER_MANAGE },
  { prefix: APP_ROUTES.STAFF, permission: PERMISSION_KEYS.ASSET_READ },
];

export function getPermissionForPath(pathname: string): PermissionKey | null {
  const match = ROUTE_RULES.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`));
  return match?.permission ?? null;
}

export const NAV_LINKS = [
  { href: APP_ROUTES.DASHBOARD, label: "Dashboard", permission: PERMISSION_KEYS.ASSET_READ },
  { href: APP_ROUTES.ASSETS, label: "Assets", permission: PERMISSION_KEYS.ASSET_READ },
  { href: APP_ROUTES.DOCUMENTS, label: "Documents", permission: PERMISSION_KEYS.DOCUMENT_READ },
  { href: APP_ROUTES.LOCATIONS, label: "Locations", permission: PERMISSION_KEYS.LOCATION_UPDATE },
  { href: APP_ROUTES.MAINTENANCE, label: "Maintenance", permission: PERMISSION_KEYS.ASSET_READ },
  { href: APP_ROUTES.REPLACEMENT, label: "Replacement", permission: PERMISSION_KEYS.REPORT_READ },
  { href: APP_ROUTES.REPORTS, label: "Reports", permission: PERMISSION_KEYS.REPORT_READ },
  { href: APP_ROUTES.STAFF, label: "Staff", permission: PERMISSION_KEYS.ASSET_READ },
  { href: APP_ROUTES.USERS, label: "Users", permission: PERMISSION_KEYS.USER_MANAGE },
  { href: APP_ROUTES.SETTINGS, label: "Settings", permission: PERMISSION_KEYS.POLICY_MANAGE },
] as const;
