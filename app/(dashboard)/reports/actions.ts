"use server";

import { writeAuditLog } from "@/lib/audit";
import { assertCanExportReports, assertCanViewReports, permissionsForSession } from "@/lib/reports/auth";
import { generateReportResult } from "@/lib/reports/generate-report";
import { isReportId } from "@/lib/reports/catalog";
import type { GenerateReportInput, ReportId, ReportResult } from "@/lib/reports/types";
import { getRequiredSession } from "@/lib/session";

export async function generateReportAction(raw: {
  reportId: string;
  scopeId?: string;
  startDate: string;
  endDate: string;
  departmentId?: string;
  categoryId?: string;
  status?: string;
  condition?: string;
  search?: string;
  assetId?: string;
}): Promise<ReportResult> {
  const session = await getRequiredSession();
  assertCanViewReports(session);

  if (!isReportId(raw.reportId)) {
    return { success: false, error: "Unknown report." };
  }

  const input: GenerateReportInput = {
    reportId: raw.reportId as ReportId,
    scopeId: raw.scopeId || undefined,
    startDate: new Date(raw.startDate),
    endDate: new Date(raw.endDate),
    departmentId: raw.departmentId || undefined,
    categoryId: raw.categoryId || undefined,
    status: raw.status || undefined,
    condition: raw.condition || undefined,
    search: raw.search || undefined,
    assetId: raw.assetId || undefined,
  };

  const result = await generateReportResult(input, session);
  if (result.success && result.data) {
    await writeAuditLog({
      actorUserId: session.userId,
      organizationId: session.organizationId,
      branchId: session.branchId,
      action: "reports.generate",
      entityType: "Report",
      entityId: raw.reportId,
      metadata: {
        reportId: raw.reportId,
        permissions: permissionsForSession(session).filter((p) => p.startsWith("reports:")),
      },
    });
  }
  return result;
}

export async function assertExportAllowedAction() {
  const session = await getRequiredSession();
  assertCanExportReports(session);
  return { ok: true as const };
}
