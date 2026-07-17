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
    };
  }

  const key = categoryKey(categoryName);
  const defaults = CATEGORY_DEPRECIATION_DEFAULTS[key];
  return {
    method: DEPRECIATION_METHOD.STRAIGHT_LINE,
    usefulLifeYears: defaults?.usefulLifeYears ?? DEFAULT_USEFUL_LIFE_YEARS,
    salvagePercent: defaults?.salvagePercent ?? DEFAULT_SALVAGE_PERCENT,
  };
}

export function calculateAssetValuation(
  asset: AssetValuationInput,
  policy?: DepreciationPolicyInput | null,
  saleMarkup = 1,
): AssetValuation {
  const purchaseCost = toNumber(asset.purchaseCost);
  const resolved = resolveDepreciationPolicy(asset.categoryName, policy);

  const usefulLifeYears = asset.depreciationUsefulLifeYears ?? resolved.usefulLifeYears;
  const salvageValue =
    asset.depreciationSalvageValue != null
      ? toNumber(asset.depreciationSalvageValue)
      : purchaseCost * (resolved.salvagePercent / 100);

  const method = asset.depreciationMethodOverride ?? resolved.method;
  const now = new Date();
  const ageMs = now.getTime() - asset.purchaseDate.getTime();
  const ageMonths = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.4375)));
  const ageYears = ageMonths / 12;

  const depreciableBase = Math.max(purchaseCost - salvageValue, 0);
  const annualDepreciation = usefulLifeYears > 0 ? depreciableBase / usefulLifeYears : 0;
  const accumulatedDepreciation = Math.min(annualDepreciation * ageYears, depreciableBase);
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
