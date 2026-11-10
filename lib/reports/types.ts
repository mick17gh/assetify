export const REPORT_IDS = [
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

export type ReportId = (typeof REPORT_IDS)[number];

export type GenerateReportInput = {
  reportId: ReportId;
  scopeId?: string;
  startDate: Date;
  endDate: Date;
  departmentId?: string;
  categoryId?: string;
  status?: string;
  condition?: string;
  search?: string;
  assetId?: string;
};

export type ReportDataPayload = {
  reportId: ReportId;
  reportName: string;
  period: { startDate: Date; endDate: Date };
  scopeName?: string;
  generatedAt: Date;
  primaryDataKey?: string;
  primarySheetName?: string;
  summary?: Record<string, string | number>;
  [key: string]: unknown;
};

export type ReportResult = {
  success: boolean;
  data?: ReportDataPayload;
  error?: string;
};
