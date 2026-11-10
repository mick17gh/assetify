import { REPORT_PERMISSION_KEYS } from "@/constants/auth";
import { REPORT_CATALOG } from "@/lib/reports/catalog";
import type { ReportId } from "@/lib/reports/types";
import { REPORT_IDS } from "@/lib/reports/types";

export { REPORT_PERMISSION_KEYS };

export function reportPermissionKey(id: ReportId): string {
  return `reports:${id}`;
}

export const PER_REPORT_PERMISSIONS = REPORT_IDS.map(reportPermissionKey);

export function canAccessReport(perms: readonly string[], id: ReportId): boolean {
  // Module generate/view alone is not enough — each report needs its reports:{id} key.
  return perms.includes(reportPermissionKey(id));
}

export function canExportReports(perms: readonly string[]): boolean {
  return perms.includes(REPORT_PERMISSION_KEYS.EXPORT);
}

export function canViewReports(perms: readonly string[]): boolean {
  return (
    perms.includes(REPORT_PERMISSION_KEYS.VIEW) ||
    perms.includes(REPORT_PERMISSION_KEYS.GENERATE) ||
    PER_REPORT_PERMISSIONS.some((key) => perms.includes(key))
  );
}

export function getAccessibleReportIds(perms: readonly string[]): ReportId[] {
  return REPORT_CATALOG.filter((entry) => canAccessReport(perms, entry.id)).map((entry) => entry.id);
}
