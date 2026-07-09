import { RECOMMENDATION_STATE } from "@/constants";

type ReplacementInput = {
  purchaseDate: Date;
  replacementYears: number;
  disposalGraceMonths: number;
  estimatedReplacementCost: number;
};

export function evaluateReplacement(input: ReplacementInput) {
  const expectedEndOfLifeDate = new Date(input.purchaseDate);
  expectedEndOfLifeDate.setFullYear(expectedEndOfLifeDate.getFullYear() + input.replacementYears);

  const recommendedReplaceDate = new Date(expectedEndOfLifeDate);
  recommendedReplaceDate.setMonth(recommendedReplaceDate.getMonth() - 3);

  const disposalEligibleDate = new Date(expectedEndOfLifeDate);
  disposalEligibleDate.setMonth(disposalEligibleDate.getMonth() + input.disposalGraceMonths);

  const now = new Date();
  const state =
    now > expectedEndOfLifeDate
      ? RECOMMENDATION_STATE.OVERDUE
      : now > recommendedReplaceDate
        ? RECOMMENDATION_STATE.APPROACHING
        : RECOMMENDATION_STATE.HEALTHY;

  return {
    expectedEndOfLifeDate,
    recommendedReplaceDate,
    disposalEligibleDate,
    state,
    estimatedReplacementCost: input.estimatedReplacementCost,
  };
}
