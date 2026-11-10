"use server";

import { revalidatePath } from "next/cache";
import { ACKNOWLEDGEMENT_METHOD, ACKNOWLEDGEMENT_STATUS, APP_ROUTES, PERMISSION_KEYS } from "@/constants";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { acceptAcknowledgementSchema } from "@/lib/validation/asset";
import { formatZodError } from "@/lib/validation/helpers";

export async function acceptAssignmentAcknowledgementAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_READ);

  const parsed = acceptAcknowledgementSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(formatZodError(parsed.error));

  const row = await db.assignmentAcknowledgement.findFirst({
    where: {
      id: parsed.data.acknowledgementId,
      userId: session.userId,
      status: ACKNOWLEDGEMENT_STATUS.PENDING,
    },
    include: { asset: { select: { id: true, organizationId: true, branchId: true, name: true } } },
  });
  if (!row) throw new Error("Pending acknowledgement not found.");

  await db.assignmentAcknowledgement.update({
    where: { id: row.id },
    data: {
      status: ACKNOWLEDGEMENT_STATUS.ACCEPTED,
      method: parsed.data.method,
      acceptedAt: new Date(),
      note:
        parsed.data.method === ACKNOWLEDGEMENT_METHOD.SIGNATURE
          ? parsed.data.acknowledgementNote?.trim() || null
          : parsed.data.method === ACKNOWLEDGEMENT_METHOD.CHECKBOX
            ? "Accepted by checkbox"
            : "Accepted by PIN",
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: row.asset.organizationId,
    branchId: row.asset.branchId,
    action: "asset.acknowledgement.accept",
    entityType: "AssignmentAcknowledgement",
    entityId: row.id,
    metadata: { assetId: row.assetId, method: parsed.data.method },
  });

  revalidatePath(APP_ROUTES.ACKNOWLEDGEMENTS);
  revalidatePath(APP_ROUTES.DASHBOARD);
  revalidatePath(`/assets/${row.assetId}`);
}
