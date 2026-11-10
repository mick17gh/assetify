import { describe, expect, it } from "vitest";
import { HEALTH_CHECK_AREAS } from "@/constants/health-check";
import { scoreHealthAssessment } from "@/lib/health-score";

describe("scoreHealthAssessment", () => {
  it("scores all fives as Optimized", () => {
    const scores = Object.fromEntries(HEALTH_CHECK_AREAS.map((area) => [area.id, 5]));
    const result = scoreHealthAssessment(scores);
    expect(result.overall).toBe(5);
    expect(result.maturityLevel).toBe(5);
    expect(result.maturityLabel).toBe("Optimized");
  });

  it("scores all ones as Unstructured", () => {
    const scores = Object.fromEntries(HEALTH_CHECK_AREAS.map((area) => [area.id, 1]));
    const result = scoreHealthAssessment(scores);
    expect(result.overall).toBe(1);
    expect(result.maturityLevel).toBe(1);
    expect(result.maturityLabel).toBe("Unstructured");
  });

  it("applies area weights", () => {
    const scores = Object.fromEntries(HEALTH_CHECK_AREAS.map((area) => [area.id, 3]));
    scores.register = 5;
    const result = scoreHealthAssessment(scores);
    expect(result.overall).toBeGreaterThan(3);
    expect(result.overall).toBeLessThan(5);
  });
});
