import { HEALTH_CHECK_AREAS, MATURITY_LEVELS } from "@/constants/health-check";

export type HealthScores = Record<string, number>;

export function scoreHealthAssessment(scores: HealthScores): {
  overall: number;
  maturityLevel: number;
  maturityLabel: string;
} {
  let weighted = 0;
  let weightTotal = 0;
  for (const area of HEALTH_CHECK_AREAS) {
    const score = Number(scores[area.id] ?? 0);
    const clamped = Math.min(5, Math.max(1, score || 1));
    weighted += clamped * area.weight;
    weightTotal += area.weight;
  }
  const overall = weightTotal > 0 ? Math.round((weighted / weightTotal) * 100) / 100 : 0;
  const maturityLevel = Math.min(5, Math.max(1, Math.round(overall)));
  const maturityLabel = MATURITY_LEVELS.find((item) => item.level === maturityLevel)?.label ?? "Unstructured";
  return { overall, maturityLevel, maturityLabel };
}
