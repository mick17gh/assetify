import type { ReportId } from "@/lib/reports/types";

export type ReportExportConfig = {
  primarySheetName: string;
  primaryDataKey: string;
};

export const REPORT_EXPORT_CONFIG: Record<ReportId, ReportExportConfig> = {
  "executive-asset-overview": { primarySheetName: "Executive Dashboard", primaryDataKey: "dashboardRows" },
  "asset-register-portfolio": { primarySheetName: "Detailed Register", primaryDataKey: "registerRows" },
  "accountability-movement": { primarySheetName: "Assignments", primaryDataKey: "assignmentRows" },
  "physical-verification": { primarySheetName: "Verification Summary", primaryDataKey: "verificationSummaryRows" },
  "condition-maintenance-warranty": { primarySheetName: "Condition", primaryDataKey: "conditionRows" },
  "lifecycle-replacement-disposal": { primarySheetName: "Replacement Planning", primaryDataKey: "replacementRows" },
  "exceptions-risk": { primarySheetName: "Exception Register", primaryDataKey: "exceptionRows" },
  "management-maturity": { primarySheetName: "Maturity Assessment", primaryDataKey: "assessmentRows" },
  "asset-audit-trail": { primarySheetName: "Change History", primaryDataKey: "changeRows" },
  "system-security-audit": { primarySheetName: "User Activity", primaryDataKey: "userActivityRows" },
  "depreciation-period-gl": { primarySheetName: "GL Journal", primaryDataKey: "glRows" },
};

export function exportMeta(reportId: ReportId) {
  const config = REPORT_EXPORT_CONFIG[reportId];
  return {
    primaryDataKey: config.primaryDataKey,
    primarySheetName: config.primarySheetName,
  };
}
