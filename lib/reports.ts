import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { calculateAssetValuation } from "@/lib/depreciation-service";
import { getAssetScopeWhere } from "@/lib/scoping";
import type { AppSession } from "@/lib/session";
import { REPORT_EXPORT_MAX_ROWS } from "@/constants/pagination";
import { USER_ROLES } from "@/constants";

function branchFilter(session: AppSession) {
  return session.role === USER_ROLES.ADMIN ? {} : { branchId: session.branchId ?? undefined };
}

function replacementEvaluationWhere(
  session: AppSession,
  filters?: { state?: string; q?: string },
): Prisma.ReplacementEvaluationWhereInput {
  const state = filters?.state?.toUpperCase();
  const q = filters?.q?.trim();

  return {
    ...(state && ["HEALTHY", "APPROACHING", "OVERDUE"].includes(state)
      ? { state: state as "HEALTHY" | "APPROACHING" | "OVERDUE" }
      : {}),
    asset: {
      ...getAssetScopeWhere(session),
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { ain: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
  };
}

function valuationEvaluationWhere(session: AppSession): Prisma.ReplacementEvaluationWhereInput {
  return {
    state: { in: ["APPROACHING", "OVERDUE"] },
    asset: {
      organizationId: session.organizationId ?? undefined,
      isActive: true,
      ...branchFilter(session),
    },
  };
}

function disposalRecordWhere(session: AppSession): Prisma.AssetDisposalRecordWhereInput {
  return {
    organizationId: session.organizationId ?? undefined,
    asset: branchFilter(session),
  };
}

async function loadDepreciationPolicies(session: AppSession) {
  const policies = await db.depreciationPolicy.findMany({
    where: { organizationId: session.organizationId ?? undefined },
  });
  return new Map(policies.map((p) => [p.categoryId, p]));
}

type ValuationEvaluation = Awaited<
  ReturnType<
    typeof db.replacementEvaluation.findMany<{
      include: {
        asset: { include: { branch: true; category: true } };
      };
    }>
  >
>[number];

type DepreciationPolicyRow = Awaited<ReturnType<typeof db.depreciationPolicy.findMany>>[number];

function mapEvaluationToValuationRow(
  row: ValuationEvaluation,
  policyByCategory: Map<string, DepreciationPolicyRow>,
): EndOfLifeValuationRow {
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
        }
      : null,
  );

  return {
    assetId: row.asset.id,
    assetName: row.asset.name,
    ain: row.asset.ain,
    branchName: row.asset.branch.name,
    state: row.state,
    purchaseCost: valuation.purchaseCost,
    currentValue: valuation.currentValue,
    recommendedSalePrice: valuation.recommendedSalePrice,
    recommendedReplaceDate: row.recommendedReplaceDate,
  };
}

export type ExportResult<T> = {
  rows: T[];
  totalCount: number;
  truncated: boolean;
};

export async function getReplacementCostTrend(
  session: AppSession,
  filters?: { state?: string; q?: string },
): Promise<Array<{ month: string; cost: number }>> {
  const orgId = session.organizationId;
  if (!orgId) return [];

  const state = filters?.state?.toUpperCase();
  const q = filters?.q?.trim();
  const branchId = session.role === USER_ROLES.ADMIN ? null : session.branchId;

  const rows = await db.$queryRaw<Array<{ month_label: string; month_key: Date; total_cost: Prisma.Decimal }>>`
    SELECT
      TO_CHAR(re."recommendedReplaceDate", 'Mon') AS month_label,
      DATE_TRUNC('month', re."recommendedReplaceDate") AS month_key,
      SUM(re."estimatedReplacementCost") AS total_cost
    FROM "ReplacementEvaluation" re
    INNER JOIN "Asset" a ON re."assetId" = a.id
    WHERE a."organizationId" = ${orgId}
      AND a."isActive" = true
      ${branchId ? Prisma.sql`AND a."branchId" = ${branchId}` : Prisma.empty}
      ${state && ["HEALTHY", "APPROACHING", "OVERDUE"].includes(state) ? Prisma.sql`AND re.state = ${state}::"RecommendationState"` : Prisma.empty}
      ${q ? Prisma.sql`AND (a.name ILIKE ${`%${q}%`} OR a.ain ILIKE ${`%${q}%`})` : Prisma.empty}
    GROUP BY month_key, month_label
    ORDER BY month_key ASC
  `;

  return rows.map((row) => ({
    month: row.month_label,
    cost: Number(row.total_cost),
  }));
}

export async function getReplacementDueReport(
  session: AppSession,
  filters?: { state?: string; q?: string },
) {
  const where = replacementEvaluationWhere(session, filters);
  const [rows, totalCount] = await Promise.all([
    db.replacementEvaluation.findMany({
      where,
      include: { asset: { include: { branch: true } } },
      orderBy: { recommendedReplaceDate: "asc" },
      take: REPORT_EXPORT_MAX_ROWS + 1,
    }),
    db.replacementEvaluation.count({ where }),
  ]);

  const truncated = rows.length > REPORT_EXPORT_MAX_ROWS;
  return {
    rows: rows.slice(0, REPORT_EXPORT_MAX_ROWS),
    totalCount,
    truncated,
  };
}

export type DepartmentCostRow = {
  departmentId: string | null;
  departmentName: string;
  branchName: string;
  assetCount: number;
  totalCost: number;
};

export async function getDepartmentCostReport(session: AppSession): Promise<DepartmentCostRow[]> {
  const groups = await db.asset.groupBy({
    by: ["departmentId", "branchId"],
    where: {
      organizationId: session.organizationId ?? undefined,
      isActive: true,
      ...branchFilter(session),
    },
    _count: { _all: true },
    _sum: { purchaseCost: true },
  });

  if (!groups.length) return [];

  const departmentIds = groups.map((g) => g.departmentId).filter((id): id is string => Boolean(id));
  const branchIds = [...new Set(groups.map((g) => g.branchId))];

  const [departments, branches] = await Promise.all([
    departmentIds.length
      ? db.department.findMany({
          where: { id: { in: departmentIds } },
          select: { id: true, name: true, branch: { select: { name: true } } },
        })
      : Promise.resolve([]),
    db.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    }),
  ]);

  const departmentMap = new Map(departments.map((d) => [d.id, d]));
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return groups
    .map((group) => {
      const department = group.departmentId ? departmentMap.get(group.departmentId) : null;
      return {
        departmentId: group.departmentId,
        departmentName: department?.name ?? "Unassigned",
        branchName: department?.branch.name ?? branchMap.get(group.branchId) ?? "Unknown",
        assetCount: group._count._all,
        totalCost: Number(group._sum.purchaseCost ?? 0),
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);
}

export type DisposalReportRow = {
  method: string;
  count: number;
  totalPurchaseValue: number;
  totalSaleProceeds: number;
};

export async function getDisposalSummaryReport(session: AppSession): Promise<DisposalReportRow[]> {
  const orgId = session.organizationId;
  if (!orgId) return [];

  const branchId = session.role === USER_ROLES.ADMIN ? null : session.branchId;
  const rows = await db.$queryRaw<
    Array<{ method: string; count: bigint; total_purchase: Prisma.Decimal; total_sale: Prisma.Decimal }>
  >`
    SELECT
      d.method::text AS method,
      COUNT(*)::bigint AS count,
      COALESCE(SUM(a."purchaseCost"), 0) AS total_purchase,
      COALESCE(SUM(d."salePrice"), 0) AS total_sale
    FROM "AssetDisposalRecord" d
    INNER JOIN "Asset" a ON d."assetId" = a.id
    WHERE d."organizationId" = ${orgId}
      ${branchId ? Prisma.sql`AND a."branchId" = ${branchId}` : Prisma.empty}
    GROUP BY d.method
    ORDER BY d.method ASC
  `;

  return rows.map((row) => ({
    method: row.method,
    count: Number(row.count),
    totalPurchaseValue: Number(row.total_purchase),
    totalSaleProceeds: Number(row.total_sale),
  }));
}

export async function getDisposalRecordsExport(session: AppSession) {
  const where = disposalRecordWhere(session);
  const [records, totalCount] = await Promise.all([
    db.assetDisposalRecord.findMany({
      where,
      include: {
        asset: { select: { purchaseCost: true, name: true, ain: true } },
      },
      orderBy: { disposalDate: "desc" },
      take: REPORT_EXPORT_MAX_ROWS + 1,
    }),
    db.assetDisposalRecord.count({ where }),
  ]);

  const truncated = records.length > REPORT_EXPORT_MAX_ROWS;
  return {
    records: records.slice(0, REPORT_EXPORT_MAX_ROWS),
    totalCount,
    truncated,
  };
}

/** @deprecated Use getDisposalSummaryReport + getDisposalRecordsExport */
export async function getDisposalReport(session: AppSession) {
  const [summary, exportResult] = await Promise.all([
    getDisposalSummaryReport(session),
    getDisposalRecordsExport(session),
  ]);
  return {
    records: exportResult.records,
    summary,
  };
}

export type EndOfLifeValuationRow = {
  assetId: string;
  assetName: string;
  ain: string;
  branchName: string;
  state: string;
  purchaseCost: number;
  currentValue: number;
  recommendedSalePrice: number;
  recommendedReplaceDate: Date;
};

export async function getEndOfLifeValuationPage(
  session: AppSession,
  pagination: { cursor?: string; take: number; limit: number },
) {
  const where = valuationEvaluationWhere(session);
  const [evaluations, policies, totalCount] = await Promise.all([
    db.replacementEvaluation.findMany({
      where,
      include: {
        asset: {
          include: {
            branch: true,
            category: true,
          },
        },
      },
      orderBy: [{ recommendedReplaceDate: "asc" }, { id: "asc" }],
      ...(pagination.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
      take: pagination.take,
    }),
    loadDepreciationPolicies(session),
    db.replacementEvaluation.count({ where }),
  ]);

  const hasMore = evaluations.length > pagination.limit;
  const pageEvaluations = evaluations.slice(0, pagination.limit);
  const nextCursor = hasMore ? pageEvaluations[pageEvaluations.length - 1]?.id ?? null : null;

  return {
    rows: pageEvaluations.map((row) => mapEvaluationToValuationRow(row, policies)),
    nextCursor,
    totalCount,
  };
}

export async function getEndOfLifeValuationExport(session: AppSession): Promise<ExportResult<EndOfLifeValuationRow>> {
  const where = valuationEvaluationWhere(session);
  const [evaluations, policies, totalCount] = await Promise.all([
    db.replacementEvaluation.findMany({
      where,
      include: {
        asset: {
          include: {
            branch: true,
            category: true,
          },
        },
      },
      orderBy: [{ recommendedReplaceDate: "asc" }, { id: "asc" }],
      take: REPORT_EXPORT_MAX_ROWS + 1,
    }),
    loadDepreciationPolicies(session),
    db.replacementEvaluation.count({ where }),
  ]);

  const truncated = evaluations.length > REPORT_EXPORT_MAX_ROWS;
  return {
    rows: evaluations.slice(0, REPORT_EXPORT_MAX_ROWS).map((row) => mapEvaluationToValuationRow(row, policies)),
    totalCount,
    truncated,
  };
}

/** @deprecated Use getEndOfLifeValuationPage or getEndOfLifeValuationExport */
export async function getEndOfLifeValuationReport(session: AppSession): Promise<EndOfLifeValuationRow[]> {
  const result = await getEndOfLifeValuationExport(session);
  return result.rows;
}

export function buildExportTruncationNote(truncated: boolean, totalCount: number, exportedCount: number) {
  if (!truncated) {
    return `Showing all ${exportedCount.toLocaleString()} matching record${exportedCount === 1 ? "" : "s"}.`;
  }
  return `Exported ${exportedCount.toLocaleString()} of ${totalCount.toLocaleString()} matching records (limit ${REPORT_EXPORT_MAX_ROWS.toLocaleString()}).`;
}
