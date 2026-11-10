import type { AppSession } from "@/lib/session";
import {
  assertCanAccessReport,
  normalizeReportRange,
  resolveReportScope,
} from "@/lib/reports/auth";
import {
  buildAccountabilityMovement,
  buildAssetAuditTrail,
  buildAssetRegister,
  buildConditionMaintenanceWarranty,
  buildDepreciationPeriodGl,
  buildExceptionsRisk,
  buildExecutiveOverview,
  buildLifecycleReplacementDisposal,
  buildManagementMaturity,
  buildPhysicalVerification,
  buildSystemSecurityAudit,
} from "@/lib/reports/aggregations";
import type { GenerateReportInput, ReportDataPayload, ReportResult } from "@/lib/reports/types";

export async function buildReportData(
  input: GenerateReportInput,
  session: AppSession,
): Promise<ReportDataPayload> {
  assertCanAccessReport(session, input.reportId);
  const period = normalizeReportRange(input.startDate, input.endDate);
  const scope = resolveReportScope(session, input.scopeId);
  const normalized: GenerateReportInput = { ...input, ...period };

  switch (normalized.reportId) {
    case "executive-asset-overview":
      return buildExecutiveOverview(normalized, session, scope);
    case "asset-register-portfolio":
      return buildAssetRegister(normalized, session, scope);
    case "accountability-movement":
      return buildAccountabilityMovement(normalized, session, scope);
    case "physical-verification":
      return buildPhysicalVerification(normalized, session, scope);
    case "condition-maintenance-warranty":
      return buildConditionMaintenanceWarranty(normalized, session, scope);
    case "lifecycle-replacement-disposal":
      return buildLifecycleReplacementDisposal(normalized, session, scope);
    case "exceptions-risk":
      return buildExceptionsRisk(normalized, session, scope);
    case "management-maturity":
      return buildManagementMaturity(normalized, session, scope);
    case "asset-audit-trail":
      return buildAssetAuditTrail(normalized, session, scope);
    case "system-security-audit":
      return buildSystemSecurityAudit(normalized, session, scope);
    case "depreciation-period-gl":
      return buildDepreciationPeriodGl(normalized, session, scope);
    default:
      throw new Error(`Unknown report: ${String((normalized as { reportId: string }).reportId)}`);
  }
}

export async function generateReportResult(
  input: GenerateReportInput,
  session: AppSession,
): Promise<ReportResult> {
  try {
    const data = await buildReportData(input, session);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to generate report.",
    };
  }
}
