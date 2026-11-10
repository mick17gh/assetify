"use server";

import { revalidatePath } from "next/cache";
import { APP_ROUTES, ERROR_MESSAGES, PERMISSION_KEYS } from "@/constants";
import { HEALTH_CHECK_AREAS } from "@/constants/health-check";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { scoreHealthAssessment } from "@/lib/health-score";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";

export async function createHealthAssessmentAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  if (!session.organizationId) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const scores: Record<string, number> = {};
  for (const area of HEALTH_CHECK_AREAS) {
    const raw = Number(formData.get(`score_${area.id}`) ?? 3);
    scores[area.id] = Math.min(5, Math.max(1, Number.isFinite(raw) ? raw : 3));
  }

  const { overall, maturityLevel } = scoreHealthAssessment(scores);
  const strengths = String(formData.get("strengths") ?? "").trim() || null;
  const weaknesses = String(formData.get("weaknesses") ?? "").trim() || null;
  const actions = String(formData.get("actions") ?? "").trim() || null;
  const recommendationTitle = String(formData.get("recommendationTitle") ?? "").trim();

  const latest = await db.healthAssessment.findFirst({
    where: { organizationId: session.organizationId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const assessment = await db.healthAssessment.create({
    data: {
      organizationId: session.organizationId,
      version: (latest?.version ?? 0) + 1,
      scores,
      overall,
      maturityLevel,
      strengths,
      weaknesses,
      actions,
      createdById: session.userId,
      recommendations: recommendationTitle
        ? {
            create: [
              {
                title: recommendationTitle,
                priority: String(formData.get("recommendationPriority") ?? "Medium"),
                ownerName: String(formData.get("recommendationOwner") ?? "").trim() || null,
                status: "OPEN",
              },
            ],
          }
        : undefined,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    action: "health-assessment.create",
    entityType: "HealthAssessment",
    entityId: assessment.id,
    metadata: { overall, maturityLevel },
  });

  revalidatePath(APP_ROUTES.SETTINGS_HEALTH_CHECK);
  revalidatePath(APP_ROUTES.REPORTS);
}
