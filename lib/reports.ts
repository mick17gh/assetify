import { db } from "@/lib/db";
import type { AppSession } from "@/lib/session";
import { USER_ROLES } from "@/constants";

export async function getReplacementDueReport(session: AppSession) {
  return db.replacementEvaluation.findMany({
    where: {
      asset: {
        organizationId: session.organizationId ?? undefined,
        ...(session.role === USER_ROLES.ADMIN ? {} : { branchId: session.branchId ?? undefined }),
      },
    },
    include: { asset: { include: { branch: true } } },
    orderBy: { recommendedReplaceDate: "asc" },
    take: 500,
  });
}
