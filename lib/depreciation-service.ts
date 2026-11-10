import {
  CATEGORY_DEPRECIATION_DEFAULTS,
  DEFAULT_SALVAGE_PERCENT,
  DEFAULT_USEFUL_LIFE_YEARS,
  DEPRECIATION_METHOD,
} from "@/constants";
import type { DepreciationMethod } from "@/lib/generated/prisma/client";

export type AssetValuationInput = {
  purchaseDate: Date;
  purchaseCost: number | { toString(): string };
  categoryName: string;
  depreciationUsefulLifeYears?: number | null;
  depreciationSalvageValue?: number | { toString(): string } | null;
  depreciationMethodOverride?: DepreciationMethod | null;
};

export type DepreciationPolicyInput = {
  method: DepreciationMethod;
  usefulLifeYears: number;
  salvagePercent: number;
  decliningRatePercent?: number | null;
};

export type AssetValuation = {
  purchaseCost: number;
  ageMonths: number;
  usefulLifeYears: number;
  salvageValue: number;
  accumulatedDepreciation: number;
  currentValue: number;
  recommendedSalePrice: number;
  method: DepreciationMethod;
};

const DEFAULT_DECLINING_RATE_PERCENT = 40;

function toNumber(value: number | { toString(): string }): number {
  return typeof value === "number" ? value : Number(value);
}

function categoryKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ")[0] ?? "";
}

export function resolveDepreciationPolicy(
  categoryName: string,
  policy?: DepreciationPolicyInput | null,
): DepreciationPolicyInput {
  if (policy) {
    return {
      method: policy.method,
      usefulLifeYears: policy.usefulLifeYears,
      salvagePercent: Number(policy.salvagePercent),
      decliningRatePercent: policy.decliningRatePercent != null ? Number(policy.decliningRatePercent) : null,
    };
  }

  const key = categoryKey(categoryName);
  const defaults = CATEGORY_DEPRECIATION_DEFAULTS[key];
  return {
    method: DEPRECIATION_METHOD.STRAIGHT_LINE,
    usefulLifeYears: defaults?.usefulLifeYears ?? DEFAULT_USEFUL_LIFE_YEARS,
    salvagePercent: defaults?.salvagePercent ?? DEFAULT_SALVAGE_PERCENT,
    decliningRatePercent: null,
  };
}

function accumulateYearByYear(
  purchaseCost: number,
  salvageValue: number,
  usefulLifeYears: number,
  ageYears: number,
  yearExpense: (bookValue: number, yearIndex: number) => number,
): number {
  if (usefulLifeYears <= 0 || ageYears <= 0) return 0;

  let book = purchaseCost;
  let accumulated = 0;
  const fullYears = Math.floor(ageYears);
  const fraction = ageYears - fullYears;

  for (let year = 1; year <= usefulLifeYears; year += 1) {
    if (year > fullYears + (fraction > 0 ? 1 : 0)) break;
    const expense = Math.max(0, Math.min(yearExpense(book, year), book - salvageValue));
    const applyFraction = year === fullYears + 1 ? fraction : 1;
    const applied = expense * applyFraction;
    accumulated += applied;
    book -= applied;
    if (book <= salvageValue) break;
  }

  return Math.min(accumulated, Math.max(purchaseCost - salvageValue, 0));
}

export function calculateAssetValuation(
  asset: AssetValuationInput,
  policy?: DepreciationPolicyInput | null,
  saleMarkup = 1,
  asOf: Date = new Date(),
): AssetValuation {
  const purchaseCost = toNumber(asset.purchaseCost);
  const resolved = resolveDepreciationPolicy(asset.categoryName, policy);

  const usefulLifeYears = asset.depreciationUsefulLifeYears ?? resolved.usefulLifeYears;
  const salvageValue =
    asset.depreciationSalvageValue != null
      ? toNumber(asset.depreciationSalvageValue)
      : purchaseCost * (resolved.salvagePercent / 100);

  const method = asset.depreciationMethodOverride ?? resolved.method;
  const asOfDate = asOf.getTime() < asset.purchaseDate.getTime() ? asset.purchaseDate : asOf;
  const ageMs = asOfDate.getTime() - asset.purchaseDate.getTime();
  const ageMonths = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.4375)));
  const ageYears = ageMonths / 12;

  const depreciableBase = Math.max(purchaseCost - salvageValue, 0);
  let accumulatedDepreciation = 0;

  if (method === DEPRECIATION_METHOD.STRAIGHT_LINE) {
    const annualDepreciation = usefulLifeYears > 0 ? depreciableBase / usefulLifeYears : 0;
    accumulatedDepreciation = Math.min(annualDepreciation * ageYears, depreciableBase);
  } else if (method === DEPRECIATION_METHOD.DECLINING_BALANCE) {
    const rate =
      (resolved.decliningRatePercent != null ? Number(resolved.decliningRatePercent) : DEFAULT_DECLINING_RATE_PERCENT) /
      100;
    accumulatedDepreciation = accumulateYearByYear(
      purchaseCost,
      salvageValue,
      usefulLifeYears,
      ageYears,
      (book) => book * rate,
    );
  } else if (method === DEPRECIATION_METHOD.DOUBLE_DECLINING_BALANCE) {
    const rate = usefulLifeYears > 0 ? 2 / usefulLifeYears : 0;
    accumulatedDepreciation = accumulateYearByYear(
      purchaseCost,
      salvageValue,
      usefulLifeYears,
      ageYears,
      (book) => book * rate,
    );
  } else if (method === DEPRECIATION_METHOD.SUM_OF_YEARS_DIGITS) {
    const sum = (usefulLifeYears * (usefulLifeYears + 1)) / 2;
    accumulatedDepreciation = accumulateYearByYear(
      purchaseCost,
      salvageValue,
      usefulLifeYears,
      ageYears,
      (_book, yearIndex) => (sum > 0 ? ((usefulLifeYears - yearIndex + 1) / sum) * depreciableBase : 0),
    );
  }

  const currentValue = Math.max(purchaseCost - accumulatedDepreciation, salvageValue);
  const recommendedSalePrice = currentValue * saleMarkup;

  return {
    purchaseCost,
    ageMonths,
    usefulLifeYears,
    salvageValue,
    accumulatedDepreciation,
    currentValue,
    recommendedSalePrice,
    method,
  };
}
