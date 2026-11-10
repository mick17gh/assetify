import { DEPRECIATION_RUN_STATUS } from "@/constants";
import { db } from "@/lib/db";
import { calculateAssetValuation, type DepreciationPolicyInput } from "@/lib/depreciation-service";
import type { DepreciationMethod, Prisma } from "@/lib/generated/prisma/client";

export type PeriodDepreciationLine = {
  assetId: string;
  ain: string;
  branchId: string | null;
  departmentId: string | null;
  method: DepreciationMethod;
  openingBookValue: number;
  periodExpense: number;
  closingBookValue: number;
  accumulatedDepreciation: number;
  categoryName: string;
  assetName: string;
  poNumber: string | null;
};

function policyInput(
  policy: {
    method: DepreciationMethod;
    usefulLifeYears: number;
    salvagePercent: { toString(): string } | number;
    decliningRatePercent: { toString(): string } | number | null;
  } | null,
): DepreciationPolicyInput | null {
  if (!policy) return null;
  return {
    method: policy.method,
    usefulLifeYears: policy.usefulLifeYears,
    salvagePercent: Number(policy.salvagePercent),
    decliningRatePercent: policy.decliningRatePercent != null ? Number(policy.decliningRatePercent) : null,
  };
}

export async function computePeriodDepreciationLines(args: {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  assetWhere?: Prisma.AssetWhereInput;
}): Promise<PeriodDepreciationLine[]> {
  const assets = await db.asset.findMany({
    where: {
      organizationId: args.organizationId,
      isActive: true,
      purchaseDate: { lte: args.periodEnd },
      status: { notIn: ["DISPOSED", "DONATED", "SOLD"] },
      ...args.assetWhere,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
    take: 5000,
  });

  const policies = await db.depreciationPolicy.findMany({
    where: { organizationId: args.organizationId },
  });
  const policyByCategory = new Map(policies.map((row) => [row.categoryId, row]));

  const lines: PeriodDepreciationLine[] = [];
  for (const asset of assets) {
    const policy = policyInput(policyByCategory.get(asset.categoryId) ?? null);
    const input = {
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      categoryName: asset.category.name,
      depreciationUsefulLifeYears: asset.depreciationUsefulLifeYears,
      depreciationSalvageValue: asset.depreciationSalvageValue,
      depreciationMethodOverride: asset.depreciationMethodOverride,
    };
    const opening = calculateAssetValuation(input, policy, 1, args.periodStart);
    const closing = calculateAssetValuation(input, policy, 1, args.periodEnd);
    const periodExpense = Math.max(0, closing.accumulatedDepreciation - opening.accumulatedDepreciation);
    if (periodExpense <= 0 && opening.currentValue <= 0) continue;

    lines.push({
      assetId: asset.id,
      ain: asset.ain,
      branchId: asset.branchId,
      departmentId: asset.departmentId,
      method: closing.method,
      openingBookValue: opening.currentValue,
      periodExpense,
      closingBookValue: closing.currentValue,
      accumulatedDepreciation: closing.accumulatedDepreciation,
      categoryName: asset.category.name,
      assetName: asset.name,
      poNumber: asset.poNumber,
    });
  }

  return lines;
}

export async function postPeriodDepreciationRun(args: {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  runByUserId: string;
  notes?: string | null;
  assetWhere?: Prisma.AssetWhereInput;
}) {
  const lines = await computePeriodDepreciationLines(args);

  const run = await db.depreciationRun.create({
    data: {
      organizationId: args.organizationId,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      status: DEPRECIATION_RUN_STATUS.POSTED,
      notes: args.notes?.trim() || null,
      runByUserId: args.runByUserId,
      lines: {
        create: lines.map((line) => ({
          assetId: line.assetId,
          ain: line.ain,
          branchId: line.branchId,
          departmentId: line.departmentId,
          method: line.method,
          openingBookValue: line.openingBookValue,
          periodExpense: line.periodExpense,
          closingBookValue: line.closingBookValue,
          accumulatedDepreciation: line.accumulatedDepreciation,
        })),
      },
    },
  });

  return { runId: run.id, lineCount: lines.length, totalExpense: lines.reduce((sum, line) => sum + line.periodExpense, 0) };
}

export function toGlJournalRows(
  lines: PeriodDepreciationLine[],
  periodLabel: string,
  branchNameById: Map<string, string>,
  departmentNameById: Map<string, string>,
) {
  const rows: Array<Record<string, string | number>> = [];
  for (const line of lines) {
    if (line.periodExpense <= 0) continue;
    const costCenter = [
      line.branchId ? branchNameById.get(line.branchId) : null,
      line.departmentId ? departmentNameById.get(line.departmentId) : null,
    ]
      .filter(Boolean)
      .join(" / ");

    rows.push({
      Period: periodLabel,
      AIN: line.ain,
      Asset: line.assetName,
      Account: "Depreciation Expense",
      Debit: Number(line.periodExpense.toFixed(2)),
      Credit: 0,
      "Cost Center": costCenter || "—",
      "Book Value Opening": Number(line.openingBookValue.toFixed(2)),
      Expense: Number(line.periodExpense.toFixed(2)),
      "Book Value Closing": Number(line.closingBookValue.toFixed(2)),
      Method: line.method,
      "PO Number": line.poNumber ?? "",
    });
    rows.push({
      Period: periodLabel,
      AIN: line.ain,
      Asset: line.assetName,
      Account: "Accumulated Depreciation",
      Debit: 0,
      Credit: Number(line.periodExpense.toFixed(2)),
      "Cost Center": costCenter || "—",
      "Book Value Opening": Number(line.openingBookValue.toFixed(2)),
      Expense: Number(line.periodExpense.toFixed(2)),
      "Book Value Closing": Number(line.closingBookValue.toFixed(2)),
      Method: line.method,
      "PO Number": line.poNumber ?? "",
    });
  }
  return rows;
}
