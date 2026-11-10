import { ASSET_CONDITION, RECOMMENDATION_STATE } from "@/constants";
import { db } from "@/lib/db";
import { calculateAssetValuation } from "@/lib/depreciation-service";
import { computePeriodDepreciationLines, toGlJournalRows } from "@/lib/depreciation-period";
import {
  formatReportDate,
  formatReportMoney,
  formatReportPercent,
  labelCondition,
  labelMovement,
  labelStatus,
} from "@/lib/reports/formatters";
import type { GenerateReportInput, ReportDataPayload } from "@/lib/reports/types";
import { exportMeta } from "@/lib/reports/sheet-config";
import { getReportCatalogEntry } from "@/lib/reports/catalog";
import type { AppSession } from "@/lib/session";
import { Prisma } from "@/lib/generated/prisma/client";
import { describeAuditAction } from "@/lib/audit-labels";

type Scope = { assetWhere: Prisma.AssetWhereInput; scopeName: string; branchId?: string };

function baseMeta(
  input: GenerateReportInput,
  scopeName: string,
): Pick<
  ReportDataPayload,
  "reportId" | "reportName" | "period" | "scopeName" | "generatedAt" | "primaryDataKey" | "primarySheetName"
> {
  const entry = getReportCatalogEntry(input.reportId);
  return {
    reportId: input.reportId,
    reportName: entry.name,
    period: { startDate: input.startDate, endDate: input.endDate },
    scopeName,
    generatedAt: new Date(),
    ...exportMeta(input.reportId),
  };
}

function assetFilters(input: GenerateReportInput, scope: Scope): Prisma.AssetWhereInput {
  return {
    ...scope.assetWhere,
    isActive: true,
    ...(input.departmentId ? { departmentId: input.departmentId } : {}),
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.status ? { status: input.status as Prisma.EnumAssetStatusFilter["equals"] } : {}),
    ...(input.condition ? { condition: input.condition as Prisma.EnumAssetConditionFilter["equals"] } : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { ain: { contains: input.search, mode: "insensitive" } },
            { serialNumber: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(input.assetId ? { id: input.assetId } : {}),
  };
}

export async function buildExecutiveOverview(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const where = assetFilters(input, scope);
  const [totalAssets, assets, openExceptions, replacementDue, verified] = await Promise.all([
    db.asset.count({ where }),
    db.asset.findMany({
      where,
      select: {
        purchaseCost: true,
        condition: true,
        status: true,
        custodianId: true,
        category: { select: { name: true } },
        branch: { select: { name: true } },
        department: { select: { name: true } },
      },
      take: 5000,
    }),
    db.assetException.count({
      where: {
        organizationId: session.organizationId ?? undefined,
        status: { in: ["IDENTIFIED", "ASSIGNED", "INVESTIGATING"] },
        ...(scope.branchId ? { asset: { branchId: scope.branchId } } : {}),
      },
    }),
    db.replacementEvaluation.count({
      where: {
        asset: where,
        state: { in: [RECOMMENDATION_STATE.APPROACHING, RECOMMENDATION_STATE.OVERDUE] },
      },
    }),
    db.assetVerification.count({
      where: {
        outcome: "VERIFIED",
        verifiedAt: { gte: input.startDate, lte: input.endDate },
        asset: where,
      },
    }),
  ]);

  const totalValue = assets.reduce((sum, a) => sum + Number(a.purchaseCost), 0);
  const goodConditions = new Set<string>([
    ASSET_CONDITION.NEW,
    ASSET_CONDITION.EXCELLENT,
    ASSET_CONDITION.GOOD,
  ]);
  const goodCondition = assets.filter((a) => goodConditions.has(a.condition)).length;
  const assigned = assets.filter((a) => a.custodianId).length;
  const byCategory = new Map<string, number>();
  const byBranch = new Map<string, number>();
  for (const asset of assets) {
    byCategory.set(asset.category.name, (byCategory.get(asset.category.name) ?? 0) + 1);
    byBranch.set(asset.branch.name, (byBranch.get(asset.branch.name) ?? 0) + 1);
  }

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      "Total Assets": totalAssets,
      "Total Acquisition Value": formatReportMoney(totalValue),
      "Verification Count (period)": verified,
      "Open Exceptions": openExceptions,
      "Replacement Due": replacementDue,
      "Accountability Rate": formatReportPercent(totalAssets ? assigned / totalAssets : 0),
      "Condition Rate": formatReportPercent(totalAssets ? goodCondition / totalAssets : 0),
    },
    dashboardRows: [
      { Metric: "Total Assets", Value: totalAssets },
      { Metric: "Total Acquisition Value", Value: formatReportMoney(totalValue) },
      { Metric: "Verified in Period", Value: verified },
      { Metric: "Open Exceptions", Value: openExceptions },
      { Metric: "Assets Requiring Attention", Value: openExceptions + replacementDue },
    ],
    performanceRows: Object.entries(
      assets.reduce<Record<string, number>>((acc, a) => {
        const key = labelCondition(a.condition);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([Condition, Count]) => ({ Condition, Count })),
    highlightRows: [
      ...[...byCategory.entries()].slice(0, 10).map(([Category, Count]) => ({
        Highlight: "Category concentration",
        Detail: Category,
        Value: Count,
      })),
      ...[...byBranch.entries()].slice(0, 10).map(([Branch, Count]) => ({
        Highlight: "Branch distribution",
        Detail: Branch,
        Value: Count,
      })),
      { Highlight: "Replacement candidates", Detail: "Approaching or overdue", Value: replacementDue },
    ],
  };
}

export async function buildAssetRegister(
  input: GenerateReportInput,
  _session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const where = assetFilters(input, scope);
  const assets = await db.asset.findMany({
    where,
    include: {
      category: true,
      branch: true,
      department: true,
      room: true,
      shelf: true,
      custodian: true,
      photos: { take: 1 },
    },
    orderBy: { name: "asc" },
    take: 10000,
  });

  const registerRows = assets.map((asset) => ({
    "Asset ID": asset.ain,
    Description: asset.name,
    Category: asset.category.name,
    "Serial Number": asset.serialNumber ?? "—",
    Manufacturer: asset.manufacturer ?? "—",
    Model: asset.modelName ?? "—",
    Branch: asset.branch.name,
    Department: asset.department?.name ?? "—",
    Location: [asset.room?.name, asset.shelf?.name].filter(Boolean).join(" / ") || "—",
    Custodian: asset.custodian?.name ?? "Unassigned",
    "Acquisition Date": formatReportDate(asset.purchaseDate),
    "Acquisition Cost": formatReportMoney(Number(asset.purchaseCost)),
    Condition: labelCondition(asset.condition),
    Status: labelStatus(asset.status),
  }));

  const missingFields = assets.filter(
    (a) => !a.serialNumber || !a.custodianId || !a.roomId || !a.description || a.photos.length === 0,
  );

  const byCategory = new Map<string, { count: number; value: number }>();
  for (const asset of assets) {
    const current = byCategory.get(asset.category.name) ?? { count: 0, value: 0 };
    current.count += 1;
    current.value += Number(asset.purchaseCost);
    byCategory.set(asset.category.name, current);
  }

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      "Register Size": assets.length,
      "Data Quality Issues": missingFields.length,
      "Completeness Rate": formatReportPercent(
        assets.length
          ? 1 -
              missingFields.length /
                Math.max(
                  assets.length *
                    5,
                  1,
                )
          : 1,
      ),
    },
    registerRows,
    portfolioRows: [...byCategory.entries()].map(([Category, stats]) => ({
      Category,
      Count: stats.count,
      "Acquisition Value": formatReportMoney(stats.value),
      Concentration: formatReportPercent(assets.length ? stats.count / assets.length : 0),
    })),
    dataQualityRows: missingFields.map((asset) => ({
      "Asset ID": asset.ain,
      Name: asset.name,
      Issues: [
        !asset.description ? "Missing description" : null,
        !asset.serialNumber ? "Missing serial" : null,
        !asset.custodianId ? "Missing custodian" : null,
        !asset.roomId ? "Missing location" : null,
        asset.photos.length === 0 ? "Missing photo" : null,
      ]
        .filter(Boolean)
        .join("; "),
    })),
  };
}

export async function buildAccountabilityMovement(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const where = assetFilters(input, scope);
  const [assignedAssets, movements, unassigned] = await Promise.all([
    db.asset.findMany({
      where: { ...where, custodianId: { not: null } },
      include: {
        custodian: { include: { staffProfile: true, branch: true } },
        branch: true,
        department: true,
        acknowledgements: { orderBy: [{ status: "desc" }, { createdAt: "desc" }], take: 1 },
      },
      take: 5000,
    }),
    db.assetMovement.findMany({
      where: {
        createdAt: { gte: input.startDate, lte: input.endDate },
        asset: where,
      },
      include: { asset: { select: { ain: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    db.asset.findMany({
      where: { ...where, custodianId: null },
      select: { ain: true, name: true, branch: { select: { name: true } }, status: true },
      take: 2000,
    }),
  ]);

  const branchIds = [...new Set(movements.flatMap((m) => [m.fromBranchId, m.toBranchId]).filter(Boolean))] as string[];
  const roomIds = [...new Set(movements.flatMap((m) => [m.fromRoomId, m.toRoomId]).filter(Boolean))] as string[];
  const userIds = [
    ...new Set(movements.flatMap((m) => [m.fromCustodianId, m.toCustodianId]).filter(Boolean)),
  ] as string[];
  const [branches, rooms, users] = await Promise.all([
    db.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true } }),
    db.room.findMany({ where: { id: { in: roomIds } }, select: { id: true, name: true } }),
    db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
  ]);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const roomName = new Map(rooms.map((r) => [r.id, r.name]));
  const userName = new Map(users.map((u) => [u.id, u.name]));

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      "Assigned Assets": assignedAssets.length,
      "Transfers in Period": movements.length,
      "Unassigned Assets": unassigned.length,
      Organization: session.organizationId ?? "—",
    },
    assignmentRows: assignedAssets.map((asset) => ({
      Employee: asset.custodian?.name ?? "—",
      "Employee Code": asset.custodian?.staffProfile?.employeeCode ?? "—",
      Department: asset.department?.name ?? "—",
      Branch: asset.branch.name,
      "Asset ID": asset.ain,
      Asset: asset.name,
      Acknowledgement:
        asset.acknowledgements[0]?.status === "PENDING"
          ? "Pending"
          : asset.acknowledgements[0]?.method ?? (asset.acknowledgements[0] ? "Accepted" : "Pending"),
      "Acknowledged At": formatReportDate(asset.acknowledgements[0]?.acceptedAt),
    })),
    movementRows: movements.map((m) => ({
      "Asset ID": m.asset.ain,
      Asset: m.asset.name,
      Type: labelMovement(m.movementType),
      "Previous Location": [m.fromBranchId && branchName.get(m.fromBranchId), m.fromRoomId && roomName.get(m.fromRoomId)]
        .filter(Boolean)
        .join(" / ") || "—",
      "New Location": [m.toBranchId && branchName.get(m.toBranchId), m.toRoomId && roomName.get(m.toRoomId)]
        .filter(Boolean)
        .join(" / ") || "—",
      "Previous Custodian": (m.fromCustodianId && userName.get(m.fromCustodianId)) || "—",
      "New Custodian": (m.toCustodianId && userName.get(m.toCustodianId)) || "—",
      Date: formatReportDate(m.createdAt),
      Reason: m.transferReason ?? m.note ?? "—",
    })),
    unassignedRows: unassigned.map((asset) => ({
      "Asset ID": asset.ain,
      Name: asset.name,
      Branch: asset.branch.name,
      Status: labelStatus(asset.status),
    })),
  };
}

export async function buildPhysicalVerification(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const campaigns = await db.verificationCampaign.findMany({
    where: {
      organizationId: session.organizationId ?? undefined,
      OR: [
        { startDate: { lte: input.endDate }, endDate: { gte: input.startDate } },
        { createdAt: { gte: input.startDate, lte: input.endDate } },
      ],
      ...(scope.branchId ? { branchIds: { has: scope.branchId } } : {}),
    },
    include: {
      snapshots: { select: { id: true } },
      verifications: {
        include: { asset: { select: { branchId: true, branch: { select: { name: true } } } }, verifiedBy: true },
      },
      exceptions: true,
      assignments: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const verificationSummaryRows = campaigns.map((c) => {
    const expected = c.snapshots?.length || c.verifications.length;
    const verified = c.verifications.filter((v) => v.outcome === "VERIFIED").length;
    const missing = c.verifications.filter((v) => v.outcome === "NOT_FOUND").length;
    const unregistered = c.verifications.filter((v) => v.outcome === "UNREGISTERED").length;
    return {
      Campaign: c.name,
      Period: `${formatReportDate(c.startDate)} – ${formatReportDate(c.endDate)}`,
      Expected: expected,
      Verified: verified,
      Missing: missing,
      Unregistered: unregistered,
      Exceptions: c.exceptions.length,
      "Completion Rate": formatReportPercent(expected ? verified / expected : 0),
    };
  });

  const exceptionRows = campaigns.flatMap((c) =>
    c.exceptions.map((ex) => ({
      Campaign: c.name,
      Type: ex.type,
      Status: ex.status,
      Description: ex.description,
      Raised: formatReportDate(ex.identifiedAt),
    })),
  );

  const officerMap = new Map<string, { officer: string; verified: number; campaigns: Set<string> }>();
  for (const campaign of campaigns) {
    for (const v of campaign.verifications) {
      const key = v.verifiedById;
      const current = officerMap.get(key) ?? {
        officer: v.verifiedBy.name,
        verified: 0,
        campaigns: new Set<string>(),
      };
      current.verified += 1;
      current.campaigns.add(campaign.name);
      officerMap.set(key, current);
    }
  }

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      Campaigns: campaigns.length,
      Verifications: campaigns.reduce((sum, c) => sum + c.verifications.length, 0),
      Exceptions: exceptionRows.length,
    },
    verificationSummaryRows,
    verificationExceptionRows: exceptionRows,
    officerPerformanceRows: [...officerMap.values()].map((row) => ({
      Officer: row.officer,
      Verified: row.verified,
      Campaigns: [...row.campaigns].join(", "),
    })),
  };
}

export async function buildConditionMaintenanceWarranty(
  input: GenerateReportInput,
  _session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const where = assetFilters(input, scope);
  const [assets, maintenance] = await Promise.all([
    db.asset.findMany({
      where,
      include: { branch: true, category: true, department: true },
      take: 5000,
    }),
    db.maintenanceRecord.findMany({
      where: {
        serviceDate: { gte: input.startDate, lte: input.endDate },
        asset: where,
      },
      include: { asset: { select: { ain: true, name: true, purchaseCost: true } } },
      orderBy: { serviceDate: "desc" },
      take: 5000,
    }),
  ]);

  const totalMaintCost = maintenance.reduce((sum, m) => sum + Number(m.cost ?? 0), 0);
  const now = Date.now();
  const warrantyRows = assets
    .filter((a) => a.warrantyExpiryDate)
    .map((a) => {
      const days = Math.ceil((a.warrantyExpiryDate!.getTime() - now) / (1000 * 60 * 60 * 24));
      return {
        "Asset ID": a.ain,
        Name: a.name,
        Branch: a.branch.name,
        "Warranty Expiry": formatReportDate(a.warrantyExpiryDate),
        "Days Remaining": days,
        Alert: days <= 30 ? "30 days" : days <= 60 ? "60 days" : days <= 90 ? "90 days" : "OK",
      };
    })
    .filter((row) => Number(row["Days Remaining"]) <= 90)
    .sort((a, b) => Number(a["Days Remaining"]) - Number(b["Days Remaining"]));

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      Assets: assets.length,
      "Maintenance Events": maintenance.length,
      "Maintenance Spend": formatReportMoney(totalMaintCost),
      "Warranty Alerts": warrantyRows.length,
    },
    conditionRows: assets.map((a) => ({
      "Asset ID": a.ain,
      Name: a.name,
      Branch: a.branch.name,
      Category: a.category.name,
      Department: a.department?.name ?? "—",
      Condition: labelCondition(a.condition),
      Status: labelStatus(a.status),
      AgeYears: Math.floor((now - a.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)),
    })),
    maintenanceRows: maintenance.map((m) => ({
      "Asset ID": m.asset.ain,
      Asset: m.asset.name,
      "Service Date": formatReportDate(m.serviceDate),
      Vendor: m.vendorName ?? "—",
      Cost: formatReportMoney(Number(m.cost ?? 0)),
      Status: m.status,
      Outcome: m.repairOutcome ?? "—",
      Notes: m.notes ?? "",
      DowntimeDays:
        m.sentDate && m.actualReturnDate
          ? Math.max(
              0,
              Math.round((m.actualReturnDate.getTime() - m.sentDate.getTime()) / (1000 * 60 * 60 * 24)),
            )
          : "—",
    })),
    warrantyRows,
  };
}

export async function buildLifecycleReplacementDisposal(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const where = assetFilters(input, scope);
  const [assets, replacements, disposals, policies] = await Promise.all([
    db.asset.findMany({
      where,
      include: { category: true, branch: true },
      take: 5000,
    }),
    db.replacementEvaluation.findMany({
      where: {
        asset: where,
        state: { in: [RECOMMENDATION_STATE.APPROACHING, RECOMMENDATION_STATE.OVERDUE] },
      },
      include: { asset: { include: { category: true, branch: true } } },
      take: 2000,
    }),
    db.assetDisposalRecord.findMany({
      where: {
        organizationId: session.organizationId ?? undefined,
        disposalDate: { gte: input.startDate, lte: input.endDate },
        asset: scope.assetWhere,
      },
      include: { asset: { select: { ain: true, name: true } } },
      take: 2000,
    }),
    db.depreciationPolicy.findMany({
      where: { organizationId: session.organizationId ?? undefined },
    }),
  ]);
  const policyByCategory = new Map(policies.map((p) => [p.categoryId, p]));

  const lifecycleRows = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => {
      const key = labelStatus(a.status);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([Stage, Count]) => ({ Stage, Count }));

  const replacementRows = replacements.map((row) => {
    const policy = policyByCategory.get(row.asset.categoryId);
    const valuation = calculateAssetValuation(
      {
        purchaseDate: row.asset.purchaseDate,
        purchaseCost: row.asset.purchaseCost,
        categoryName: row.asset.category.name,
        depreciationUsefulLifeYears: row.asset.depreciationUsefulLifeYears,
        depreciationSalvageValue: row.asset.depreciationSalvageValue,
        depreciationMethodOverride: row.asset.depreciationMethodOverride,
      },
      policy
        ? {
            method: policy.method,
            usefulLifeYears: policy.usefulLifeYears,
            salvagePercent: Number(policy.salvagePercent),
            decliningRatePercent: policy.decliningRatePercent != null ? Number(policy.decliningRatePercent) : null,
          }
        : null,
    );
    return {
      "Asset ID": row.asset.ain,
      Name: row.asset.name,
      Branch: row.asset.branch.name,
      Category: row.asset.category.name,
      State: row.state,
      "Estimated Replacement Cost": formatReportMoney(Number(row.estimatedReplacementCost ?? 0)),
      "Current Value": formatReportMoney(valuation.currentValue),
    };
  });

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      Assets: assets.length,
      "Replacement Candidates": replacements.length,
      Disposals: disposals.length,
      "Estimated Replacement Budget": formatReportMoney(
        replacements.reduce((sum, r) => sum + Number(r.estimatedReplacementCost ?? 0), 0),
      ),
    },
    lifecycleRows,
    replacementRows,
    disposalRows: disposals.map((d) => ({
      "Asset ID": d.asset.ain,
      Name: d.asset.name,
      Method: d.method,
      Date: formatReportDate(d.disposalDate),
      Reason: d.reason,
      Proceeds: formatReportMoney(Number(d.salePrice ?? 0)),
      "Book Value": formatReportMoney(Number(d.bookValueAtDisposal)),
    })),
  };
}

export async function buildExceptionsRisk(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const exceptions = await db.assetException.findMany({
    where: {
      organizationId: session.organizationId ?? undefined,
      identifiedAt: { gte: input.startDate, lte: input.endDate },
      ...(scope.branchId ? { OR: [{ branchId: scope.branchId }, { asset: { branchId: scope.branchId } }] } : {}),
    },
    include: {
      asset: { select: { ain: true, name: true, branch: { select: { name: true } }, category: { select: { name: true } } } },
      assignedTo: { select: { name: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { identifiedAt: "desc" },
    take: 5000,
  });

  const priorityOf = (type: string, status: string) => {
    if (type.includes("MISSING") || type.includes("DISPOSED")) return "Critical";
    if (status === "IDENTIFIED" || status === "ASSIGNED") return "High";
    if (status === "INVESTIGATING") return "Medium";
    return "Low";
  };

  const open = exceptions.filter((e) => ["IDENTIFIED", "ASSIGNED", "INVESTIGATING"].includes(e.status));
  const resolved = exceptions.filter((e) => ["RESOLVED", "APPROVED"].includes(e.status));

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      Exceptions: exceptions.length,
      Open: open.length,
      "Resolution Rate": formatReportPercent(exceptions.length ? resolved.length / exceptions.length : 0),
    },
    exceptionRows: exceptions.map((ex) => ({
      "Asset ID": ex.asset?.ain ?? "—",
      Asset: ex.asset?.name ?? "—",
      Branch: ex.asset?.branch.name ?? "—",
      Category: ex.asset?.category.name ?? "—",
      Type: ex.type,
      Status: ex.status,
      Priority: priorityOf(ex.type, ex.status),
      Owner: ex.assignedTo?.name ?? "Unassigned",
      Raised: formatReportDate(ex.identifiedAt),
      AgeDays: Math.floor((Date.now() - ex.identifiedAt.getTime()) / (1000 * 60 * 60 * 24)),
      Description: ex.description,
    })),
    correctiveActionRows: exceptions.map((ex) => ({
      Exception: ex.id.slice(0, 8),
      Owner: ex.assignedTo?.name ?? "Unassigned",
      Status: ex.status,
      "Latest Action": ex.events[0]?.note ?? ex.resolution ?? "—",
      Raised: formatReportDate(ex.identifiedAt),
      Resolved: formatReportDate(ex.resolvedAt),
    })),
    riskSummaryRows: Object.entries(
      exceptions.reduce<Record<string, number>>((acc, ex) => {
        const key = priorityOf(ex.type, ex.status);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([Priority, Count]) => ({ Priority, Count })),
  };
}

export async function buildManagementMaturity(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const assessments = await db.healthAssessment.findMany({
    where: {
      organizationId: session.organizationId ?? undefined,
      createdAt: { gte: input.startDate, lte: input.endDate },
    },
    include: { recommendations: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const latest = assessments[0];
  const previous = assessments[1];

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      Assessments: assessments.length,
      "Latest Score": latest ? Number(latest.overall) : 0,
      "Maturity Level": latest?.maturityLevel ?? 0,
      "Improvement (pts)":
        latest && previous ? Number(latest.overall) - Number(previous.overall) : 0,
      Scope: scope.scopeName,
    },
    assessmentRows: latest
      ? Object.entries((latest.scores as Record<string, number>) ?? {}).map(([Area, Score]) => ({
          Area,
          Score,
          Assessor: latest.createdBy.name,
          Date: formatReportDate(latest.createdAt),
        }))
      : [{ Area: "No assessment yet", Score: 0, Assessor: "—", Date: "—" }],
    maturityDashboardRows: assessments.map((a) => ({
      Date: formatReportDate(a.createdAt),
      Overall: Number(a.overall),
      Level: a.maturityLevel,
      Assessor: a.createdBy.name,
    })),
    roadmapRows: (latest?.recommendations ?? []).map((r) => ({
      Recommendation: r.title,
      Priority: r.priority,
      Owner: r.ownerName ?? "—",
      "Target Date": formatReportDate(r.targetDate),
      Status: r.status,
    })),
  };
}

export async function buildAssetAuditTrail(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const assetScope: Prisma.AssetWhereInput = {
    ...scope.assetWhere,
    ...(input.assetId ? { id: input.assetId } : {}),
    ...(input.departmentId ? { departmentId: input.departmentId } : {}),
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
  };

  const [logs, movements, statusHistory, maintenance, disposals] = await Promise.all([
    db.auditLog.findMany({
      where: {
        organizationId: session.organizationId ?? undefined,
        createdAt: { gte: input.startDate, lte: input.endDate },
        ...(input.assetId ? { entityId: input.assetId } : {}),
        entityType: { in: ["Asset", "AssetMovement", "MaintenanceRecord", "AssetException"] },
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
      },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    db.assetMovement.findMany({
      where: {
        createdAt: { gte: input.startDate, lte: input.endDate },
        asset: assetScope,
      },
      include: {
        asset: { select: { ain: true, name: true } },
        movedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    db.assetStatusHistory.findMany({
      where: {
        createdAt: { gte: input.startDate, lte: input.endDate },
        asset: assetScope,
      },
      include: { asset: { select: { ain: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    db.maintenanceRecord.findMany({
      where: {
        serviceDate: { gte: input.startDate, lte: input.endDate },
        asset: assetScope,
      },
      include: { asset: { select: { ain: true, name: true } } },
      orderBy: { serviceDate: "desc" },
      take: 2000,
    }),
    db.assetDisposalRecord.findMany({
      where: {
        organizationId: session.organizationId ?? undefined,
        disposalDate: { gte: input.startDate, lte: input.endDate },
        ...(input.assetId ? { assetId: input.assetId } : {}),
        asset: scope.branchId ? { branchId: scope.branchId } : undefined,
      },
      include: {
        asset: { select: { ain: true, name: true } },
        disposedBy: { select: { name: true } },
      },
      orderBy: { disposalDate: "desc" },
      take: 1000,
    }),
  ]);

  type ChangeRow = {
    When: string;
    User: string;
    Action: string;
    Entity: string;
    "Entity ID": string;
    Asset: string;
    Changes: string;
  };

  const changeRows: ChangeRow[] = [];

  for (const log of logs) {
    const metadata = (log.metadata ?? {}) as { changes?: Array<{ field: string; from: unknown; to: unknown }> };
    const changes = metadata.changes ?? [];
    changeRows.push({
      When: formatReportDate(log.createdAt),
      User: log.actor?.name ?? "System",
      Action: describeAuditAction(log.action, log.entityType).action,
      Entity: log.entityType,
      "Entity ID": log.entityId ?? "—",
      Asset: log.entityId ?? "—",
      Changes:
        changes.length > 0
          ? changes.map((c) => `${c.field}: ${String(c.from ?? "—")} → ${String(c.to ?? "—")}`).join("; ")
          : "—",
    });
  }

  for (const move of movements) {
    changeRows.push({
      When: formatReportDate(move.createdAt),
      User: move.movedBy.name,
      Action: "Asset movement",
      Entity: "AssetMovement",
      "Entity ID": move.id,
      Asset: `${move.asset.name} (${move.asset.ain})`,
      Changes: [
        move.fromBranchId !== move.toBranchId ? `branch: ${move.fromBranchId ?? "—"} → ${move.toBranchId ?? "—"}` : null,
        move.fromRoomId !== move.toRoomId ? `room: ${move.fromRoomId ?? "—"} → ${move.toRoomId ?? "—"}` : null,
        move.fromShelfId !== move.toShelfId ? `shelf: ${move.fromShelfId ?? "—"} → ${move.toShelfId ?? "—"}` : null,
        move.fromCustodianId !== move.toCustodianId
          ? `custodian: ${move.fromCustodianId ?? "—"} → ${move.toCustodianId ?? "—"}`
          : null,
        move.fromDepartmentId !== move.toDepartmentId
          ? `department: ${move.fromDepartmentId ?? "—"} → ${move.toDepartmentId ?? "—"}`
          : null,
        `type: ${move.movementType}`,
        move.note ? `note: ${move.note}` : null,
      ]
        .filter(Boolean)
        .join("; "),
    });
  }

  for (const row of statusHistory) {
    changeRows.push({
      When: formatReportDate(row.createdAt),
      User: "—",
      Action: "Status change",
      Entity: "AssetStatusHistory",
      "Entity ID": row.id,
      Asset: `${row.asset.name} (${row.asset.ain})`,
      Changes: [
        `status: ${row.fromStatus ?? "—"} → ${row.toStatus}`,
        row.note ? `note: ${row.note}` : null,
      ]
        .filter(Boolean)
        .join("; "),
    });
  }

  for (const row of maintenance) {
    changeRows.push({
      When: formatReportDate(row.serviceDate),
      User: "—",
      Action: "Maintenance",
      Entity: "MaintenanceRecord",
      "Entity ID": row.id,
      Asset: `${row.asset.name} (${row.asset.ain})`,
      Changes: [
        `status: ${row.status}`,
        row.repairOutcome ? `outcome: ${row.repairOutcome}` : null,
        row.cost != null ? `cost: ${String(row.cost)}` : null,
        row.notes ? `notes: ${row.notes}` : null,
        row.description ? `description: ${row.description}` : null,
      ]
        .filter(Boolean)
        .join("; "),
    });
  }

  for (const row of disposals) {
    changeRows.push({
      When: formatReportDate(row.disposalDate),
      User: row.disposedBy.name,
      Action: "Disposal",
      Entity: "AssetDisposalRecord",
      "Entity ID": row.id,
      Asset: `${row.asset.name} (${row.asset.ain})`,
      Changes: [
        `method: ${row.method}`,
        `reason: ${row.reason}`,
        row.salePrice != null ? `salePrice: ${String(row.salePrice)}` : null,
        `bookValue: ${String(row.bookValueAtDisposal)}`,
      ]
        .filter(Boolean)
        .join("; "),
    });
  }

  changeRows.sort((a, b) => (a.When < b.When ? 1 : a.When > b.When ? -1 : 0));

  const byUser = new Map<string, number>();
  const byAction = new Map<string, number>();
  for (const row of changeRows) {
    byUser.set(row.User, (byUser.get(row.User) ?? 0) + 1);
    byAction.set(row.Action, (byAction.get(row.Action) ?? 0) + 1);
  }

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      Changes: changeRows.length,
      "Audit Logs": logs.length,
      Movements: movements.length,
      "Status Changes": statusHistory.length,
      Maintenance: maintenance.length,
      Disposals: disposals.length,
      Users: byUser.size,
    },
    changeRows,
    activitySummaryRows: [...byAction.entries()].map(([Event, Count]) => ({ Event, Count })),
    changeAnalysisRows: [...byUser.entries()].map(([User, Count]) => ({ User, Count })),
  };
}

export async function buildSystemSecurityAudit(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  const logs = await db.auditLog.findMany({
    where: {
      organizationId: session.organizationId ?? undefined,
      createdAt: { gte: input.startDate, lte: input.endDate },
      ...(scope.branchId ? { branchId: scope.branchId } : {}),
    },
    include: { actor: { select: { name: true, email: true, role: true, isActive: true } } },
    orderBy: { createdAt: "desc" },
    take: 8000,
  });

  const userActivityRows = logs
    .filter((l) => l.action.includes("user") || l.action.includes("auth") || l.action.includes("sign"))
    .map((l) => ({
      When: formatReportDate(l.createdAt),
      User: l.actor?.name ?? "System",
      Email: l.actor?.email ?? "—",
      Action: describeAuditAction(l.action, l.entityType).action,
      IP: l.ipAddress ?? "—",
    }));

  const adminRows = logs
    .filter(
      (l) =>
        l.action.includes("settings") ||
        l.action.includes("policy") ||
        l.action.includes("branch") ||
        l.action.includes("permission") ||
        l.action.includes("role") ||
        l.action.includes("organization"),
    )
    .map((l) => ({
      When: formatReportDate(l.createdAt),
      User: l.actor?.name ?? "System",
      Action: describeAuditAction(l.action, l.entityType).action,
      Entity: l.entityType,
      Details: JSON.stringify(l.metadata ?? {}),
    }));

  const opsRows = logs
    .filter(
      (l) =>
        l.action.includes("import") ||
        l.action.includes("export") ||
        l.action.includes("bulk") ||
        l.action.includes("offline") ||
        l.action.includes("reports."),
    )
    .map((l) => ({
      When: formatReportDate(l.createdAt),
      User: l.actor?.name ?? "System",
      Action: describeAuditAction(l.action, l.entityType).action,
      Entity: l.entityType,
      Details: JSON.stringify(l.metadata ?? {}),
    }));

  const inactiveElevated = await db.user.count({
    where: {
      organizationId: session.organizationId ?? undefined,
      isActive: false,
      role: { in: ["ADMIN", "MANAGER"] },
    },
  });

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      "Audit Events": logs.length,
      "User Activity Rows": userActivityRows.length,
      "Admin Changes": adminRows.length,
      "Data Operations": opsRows.length,
      "Inactive Elevated Accounts": inactiveElevated,
    },
    userActivityRows: userActivityRows.length
      ? userActivityRows
      : logs.slice(0, 200).map((l) => ({
          When: formatReportDate(l.createdAt),
          User: l.actor?.name ?? "System",
          Email: l.actor?.email ?? "—",
          Action: describeAuditAction(l.action, l.entityType).action,
          IP: l.ipAddress ?? "—",
        })),
    adminChangeRows: adminRows,
    systemOperationRows: opsRows,
  };
}

export async function buildDepreciationPeriodGl(
  input: GenerateReportInput,
  session: AppSession,
  scope: Scope,
): Promise<ReportDataPayload> {
  if (!session.organizationId) throw new Error("Organization required.");

  const lines = await computePeriodDepreciationLines({
    organizationId: session.organizationId,
    periodStart: input.startDate,
    periodEnd: input.endDate,
    assetWhere: assetFilters(input, scope),
  });

  const branchIds = [...new Set(lines.map((line) => line.branchId).filter(Boolean))] as string[];
  const departmentIds = [...new Set(lines.map((line) => line.departmentId).filter(Boolean))] as string[];
  const [branches, departments] = await Promise.all([
    branchIds.length
      ? db.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
    departmentIds.length
      ? db.department.findMany({ where: { id: { in: departmentIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);
  const branchNameById = new Map(branches.map((row) => [row.id, row.name]));
  const departmentNameById = new Map(departments.map((row) => [row.id, row.name]));
  const periodLabel = `${formatReportDate(input.startDate)} – ${formatReportDate(input.endDate)}`;
  const glRows = toGlJournalRows(lines, periodLabel, branchNameById, departmentNameById);
  const totalExpense = lines.reduce((sum, line) => sum + line.periodExpense, 0);

  return {
    ...baseMeta(input, scope.scopeName),
    summary: {
      Assets: lines.length,
      "Period Expense": formatReportMoney(totalExpense),
      "GL Lines": glRows.length,
    },
    scheduleRows: lines.map((line) => ({
      AIN: line.ain,
      Asset: line.assetName,
      Category: line.categoryName,
      Method: line.method,
      "Opening Book Value": formatReportMoney(line.openingBookValue),
      "Period Expense": formatReportMoney(line.periodExpense),
      "Closing Book Value": formatReportMoney(line.closingBookValue),
      "Accumulated Depreciation": formatReportMoney(line.accumulatedDepreciation),
      "PO Number": line.poNumber ?? "",
    })),
    glRows,
  };
}
