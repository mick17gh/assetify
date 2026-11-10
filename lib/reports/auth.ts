import { ROLE_PERMISSIONS } from "@/constants";
import { getAssetScopeWhere } from "@/lib/scoping";
import type { AppSession } from "@/lib/session";
import { canAccessReport, canExportReports, canViewReports } from "@/lib/reports/permissions";
import type { ReportId } from "@/lib/reports/types";
import { Prisma } from "@/lib/generated/prisma/client";

export function permissionsForSession(session: AppSession): readonly string[] {
  return ROLE_PERMISSIONS[session.role] ?? [];
}

export function assertCanViewReports(session: AppSession) {
  if (!canViewReports(permissionsForSession(session))) {
    throw new Error("You do not have permission to view reports.");
  }
}

export function assertCanAccessReport(session: AppSession, reportId: ReportId) {
  if (!canAccessReport(permissionsForSession(session), reportId)) {
    throw new Error("You do not have permission to generate this report.");
  }
}

export function assertCanExportReports(session: AppSession) {
  if (!canExportReports(permissionsForSession(session))) {
    throw new Error("You do not have permission to export reports.");
  }
}

export function resolveReportScope(
  session: AppSession,
  scopeId?: string,
): { assetWhere: Prisma.AssetWhereInput; scopeName: string; branchId?: string } {
  const base = getAssetScopeWhere(session);
  if (!scopeId) {
    return { assetWhere: base, scopeName: "All accessible branches" };
  }

  if (session.role !== "ADMIN" && session.branchId && session.branchId !== scopeId) {
    throw new Error("You cannot select a branch outside your scope.");
  }

  return {
    assetWhere: { ...base, branchId: scopeId },
    scopeName: "Selected branch",
    branchId: scopeId,
  };
}

export function normalizeReportRange(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  if (start > end) throw new Error("Start date must be before end date.");
  return { startDate: start, endDate: end };
}
