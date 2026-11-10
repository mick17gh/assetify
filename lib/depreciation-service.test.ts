import { describe, expect, it } from "vitest";
import { DEPRECIATION_METHOD } from "@/constants";
import { calculateAssetValuation } from "@/lib/depreciation-service";

function yearsAgo(years: number) {
  // Match service month length (30.4375 days) so floored ageMonths is exact.
  return new Date(Date.now() - years * 12 * 30.4375 * 24 * 60 * 60 * 1000);
}

const baseAsset = {
  purchaseDate: yearsAgo(1),
  purchaseCost: 100_000,
  categoryName: "Equipment",
};

describe("calculateAssetValuation", () => {
  it("straight-line year 1 is 18_000 on 90_000 base", () => {
    const valuation = calculateAssetValuation(baseAsset, {
      method: DEPRECIATION_METHOD.STRAIGHT_LINE,
      usefulLifeYears: 5,
      salvagePercent: 10,
    });
    expect(valuation.ageMonths).toBe(12);
    expect(valuation.accumulatedDepreciation).toBeCloseTo(18_000, 0);
    expect(valuation.currentValue).toBeCloseTo(82_000, 0);
  });

  it("declining balance 40% year 1 is 40_000", () => {
    const valuation = calculateAssetValuation(baseAsset, {
      method: DEPRECIATION_METHOD.DECLINING_BALANCE,
      usefulLifeYears: 5,
      salvagePercent: 10,
      decliningRatePercent: 40,
    });
    expect(valuation.accumulatedDepreciation).toBeCloseTo(40_000, 0);
    expect(valuation.currentValue).toBeCloseTo(60_000, 0);
  });

  it("double declining balance year 1 is 40_000", () => {
    const valuation = calculateAssetValuation(baseAsset, {
      method: DEPRECIATION_METHOD.DOUBLE_DECLINING_BALANCE,
      usefulLifeYears: 5,
      salvagePercent: 10,
    });
    expect(valuation.accumulatedDepreciation).toBeCloseTo(40_000, 0);
  });

  it("sum of years digits year 1 is 30_000", () => {
    const valuation = calculateAssetValuation(baseAsset, {
      method: DEPRECIATION_METHOD.SUM_OF_YEARS_DIGITS,
      usefulLifeYears: 5,
      salvagePercent: 10,
    });
    expect(valuation.accumulatedDepreciation).toBeCloseTo(30_000, 0);
  });
});
