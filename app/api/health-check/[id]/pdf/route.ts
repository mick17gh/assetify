import { NextResponse } from "next/server";
import { HEALTH_CHECK_AREAS, MATURITY_LEVELS } from "@/constants/health-check";
import { db } from "@/lib/db";
import { buildPdfReport } from "@/lib/export/report-export";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { PERMISSION_KEYS } from "@/constants";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const { id } = await context.params;

  const assessment = await db.healthAssessment.findFirst({
    where: { id, organizationId: session.organizationId ?? undefined },
    include: { createdBy: { select: { name: true } }, recommendations: true },
  });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const scores = (assessment.scores as Record<string, number>) ?? {};
  const levelLabel =
    MATURITY_LEVELS.find((item) => item.level === assessment.maturityLevel)?.label ?? String(assessment.maturityLevel);

  const rows = HEALTH_CHECK_AREAS.map((area) => ({
    Area: area.name,
    Score: Number(scores[area.id] ?? 0),
    Weight: area.weight,
  }));

  const pdf = await buildPdfReport("Asset Management Maturity Assessment", [
    { key: "Area", header: "Area", width: 28 },
    { key: "Score", header: "Score", width: 10 },
    { key: "Weight", header: "Weight", width: 10 },
  ], rows, {
    note: `Overall ${Number(assessment.overall).toFixed(2)} · Level ${assessment.maturityLevel} (${levelLabel}) · ${assessment.createdBy.name}`,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="maturity-assessment-v${assessment.version}.pdf"`,
    },
  });
}
