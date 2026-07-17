import { db } from "@/lib/db";
import { calculateAssetValuation } from "@/lib/depreciation-service";
import type { AppSession } from "@/lib/session";
import { USER_ROLES } from "@/constants";

function branchFilter(session: AppSession) {
  return session.role === USER_ROLES.ADMIN ? {} : { branchId: session.branchId ?? undefined };
}

export async function getReplacementDueReport(session: AppSession) {
  return db.replacementEvaluation.findMany({
    where: {
      asset: {
        organizationId: session.organizationId ?? undefined,
        ...branchFilter(session),
      },
    },
    include: { asset: { include: { branch: true } } },
    orderBy: { recommendedReplaceDate: "asc" },
    take: 500,
  });
}

export type DepartmentCostRow = {
  departmentId: string | null;
  departmentName: string;
  branchName: string;
  assetCount: number;
  totalCost: number;
};

export async function getDepartmentCostReport(session: AppSession): Promise<DepartmentCostRow[]> {
  const assets = await db.asset.findMany({
    where: {
      organizationId: session.organizationId ?? undefined,
      isActive: true,
      ...branchFilter(session),
    },
    select: {
      departmentId: true,
      purchaseCost: true,
      department: { select: { id: true, name: true, branch: { select: { name: true } } } },
      branch: { select: { name: true } },
    },
  });

  const grouped = new Map<string, DepartmentCostRow>();

  for (const asset of assets) {
    const key = asset.departmentId ?? "__unassigned__";
    const existing = grouped.get(key);
    const cost = Number(asset.purchaseCost);

    if (existing) {
      existing.assetCount += 1;
      existing.totalCost += cost;
    } else {
      grouped.set(key, {
        departmentId: asset.departmentId,
        departmentName: asset.department?.name ?? "Unassigned",
        branchName: asset.department?.branch.name ?? asset.branch.name,
        assetCount: 1,
        totalCost: cost,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.totalCost - a.totalCost);
}

export type DisposalReportRow = {
  method: string;
  count: number;
  totalPurchaseValue: number;
  totalSaleProceeds: number;
};

export async function getDisposalReport(session: AppSession) {
  const records = await db.assetDisposalRecord.findMany({
    where: {
      organizationId: session.organizationId ?? undefined,
      asset: branchFilter(session),
    },
    include: {
      asset: { select: { purchaseCost: true, name: true, ain: true } },
    },
    orderBy: { disposalDate: "desc" },
    take: 500,
  });

  const summary = new Map<string, DisposalReportRow>();
  for (const record of records) {
    const existing = summary.get(record.method) ?? {
      method: record.method,
      count: 0,
      totalPurchaseValue: 0,
      totalSaleProceeds: 0,
    };
    existing.count += 1;
    existing.totalPurchaseValue += Number(record.asset.purchaseCost);
    if (record.salePrice) existing.totalSaleProceeds += Number(record.salePrice);
    summary.set(record.method, existing);
  }

  return {
    records,
    summary: Array.from(summary.values()),
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

export async function getEndOfLifeValuationReport(session: AppSession): Promise<EndOfLifeValuationRow[]> {
  const evaluations = await db.replacementEvaluation.findMany({
    where: {
      state: { in: ["APPROACHING", "OVERDUE"] },
      asset: {
        organizationId: session.organizationId ?? undefined,
        isActive: true,
        ...branchFilter(session),
      },
    },
    include: {
      asset: {
        include: {
          branch: true,
          category: true,
        },
      },
    },
    orderBy: { recommendedReplaceDate: "asc" },
    take: 500,
  });

  const policies = await db.depreciationPolicy.findMany({
    where: { organizationId: session.organizationId ?? undefined },
  });
  const policyByCategory = new Map(policies.map((p) => [p.categoryId, p]));

  return evaluations.map((row) => {
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
  });
}
