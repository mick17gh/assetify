import type { ReportId } from "@/lib/reports/types";
import { REPORT_IDS } from "@/lib/reports/types";

export type ReportCatalogEntry = {
  id: ReportId;
  name: string;
  description: string;
  category: "Executive" | "Operational" | "Audit";
  audience: string;
};

export const REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    id: "executive-asset-overview",
    name: "Executive Asset Overview",
    description: "Consolidated view of asset value, condition, verification and management risks.",
    category: "Executive",
    audience: "CEO, Board, Executive Management",
  },
  {
    id: "asset-register-portfolio",
    name: "Asset Register & Portfolio",
    description: "Authoritative inventory with portfolio analysis and data-quality checks.",
    category: "Operational",
    audience: "Asset Manager, Finance, Admin",
  },
  {
    id: "accountability-movement",
    name: "Asset Accountability & Movement",
    description: "Custodian assignments, transfers, and unassigned or outstanding assets.",
    category: "Operational",
    audience: "Asset Manager, HR, Branch Managers",
  },
  {
    id: "physical-verification",
    name: "Physical Verification & Assurance",
    description: "Campaign verification completion, exceptions, and officer performance.",
    category: "Operational",
    audience: "Asset Manager, Internal Audit",
  },
  {
    id: "condition-maintenance-warranty",
    name: "Condition, Maintenance & Warranty",
    description: "Condition distribution, repair activity, and warranty exposure.",
    category: "Operational",
    audience: "Asset Manager, Operations, Finance",
  },
  {
    id: "lifecycle-replacement-disposal",
    name: "Lifecycle, Replacement & Disposal",
    description: "Lifecycle stages, replacement planning, and disposal register.",
    category: "Executive",
    audience: "CEO, Finance, Asset Manager",
  },
  {
    id: "exceptions-risk",
    name: "Asset Exceptions & Risk",
    description: "Open exceptions, corrective actions, and risk summary by severity.",
    category: "Operational",
    audience: "CEO, Risk, Internal Audit, Asset Manager",
  },
  {
    id: "management-maturity",
    name: "Management Health Check & Maturity",
    description: "Maturity scores, dashboard, and improvement roadmap from assessments.",
    category: "Executive",
    audience: "CEO, Consultants, Asset Manager",
  },
  {
    id: "asset-audit-trail",
    name: "Asset Audit Trail & Change History",
    description: "Field-level and activity history for individual assets.",
    category: "Audit",
    audience: "Asset Manager, Internal Audit",
  },
  {
    id: "system-security-audit",
    name: "System Activity & Security Audit",
    description: "User activity, administrative changes, and system operations.",
    category: "Audit",
    audience: "System Administrator, IT Security, Internal Audit",
  },
  {
    id: "depreciation-period-gl",
    name: "Period Depreciation & GL Export",
    description: "Period depreciation expense with debit/credit GL journal lines for financial close.",
    category: "Operational",
    audience: "Finance, Asset Manager",
  },
];

export function getReportCatalogEntry(id: ReportId): ReportCatalogEntry {
  const entry = REPORT_CATALOG.find((item) => item.id === id);
  if (!entry) throw new Error(`Unknown report: ${id}`);
  return entry;
}

export function isReportId(value: string): value is ReportId {
  return (REPORT_IDS as readonly string[]).includes(value);
}
