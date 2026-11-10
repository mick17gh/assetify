import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS, USER_ROLES } from "@/constants/auth";
import { canAccessReport, getAccessibleReportIds } from "@/lib/reports/permissions";

describe("report permissions", () => {
  it("does not grant every report from reports:generate alone", () => {
    const manager = ROLE_PERMISSIONS[USER_ROLES.MANAGER];
    expect(manager.includes("reports:generate")).toBe(true);
    expect(canAccessReport(manager, "system-security-audit")).toBe(false);
    expect(canAccessReport(manager, "executive-asset-overview")).toBe(true);
  });

  it("limits finance to finance-oriented reports", () => {
    const finance = ROLE_PERMISSIONS[USER_ROLES.FINANCE];
    const ids = getAccessibleReportIds(finance);
    expect(ids).toContain("lifecycle-replacement-disposal");
    expect(ids).toContain("depreciation-period-gl");
    expect(ids).not.toContain("system-security-audit");
    expect(ids).not.toContain("physical-verification");
  });

  it("gives admin every report including system security", () => {
    const admin = ROLE_PERMISSIONS[USER_ROLES.ADMIN];
    expect(canAccessReport(admin, "system-security-audit")).toBe(true);
    expect(getAccessibleReportIds(admin)).toHaveLength(11);
  });
});
