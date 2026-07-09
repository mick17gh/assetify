"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { APP_ROUTES, ERROR_MESSAGES, PERMISSION_KEYS } from "@/constants";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { createUserSchema, updateUserSchema } from "@/lib/validation/user";
import { parseOptionalCuid } from "@/lib/validation/helpers";

export async function createUserAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.USER_MANAGE);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const branchId = parseOptionalCuid(parsed.data.branchId);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      emailVerified: true,
      role: parsed.data.role,
      branchId: branchId ?? null,
      organizationId: session.organizationId,
      isActive: true,
    },
  });

  await db.account.create({
    data: {
      id: randomUUID(),
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: passwordHash,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  revalidatePath(APP_ROUTES.USERS);
}

export async function updateUserAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.USER_MANAGE);

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const branchId = parseOptionalCuid(parsed.data.branchId);

  await db.user.updateMany({
    where: { id: parsed.data.id, organizationId: session.organizationId ?? undefined },
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      branchId: branchId ?? null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath(APP_ROUTES.USERS);
}

export async function sendUserPasswordResetAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.USER_MANAGE);

  const userId = String(formData.get("userId") ?? "");
  const user = await db.user.findFirst({
    where: { id: userId, organizationId: session.organizationId ?? undefined },
  });
  if (!user) throw new Error("User not found.");

  // Password reset is triggered by the user via forgot-password flow; admin can share credentials on create.
  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    action: "user.password_reset_requested",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email },
  });
}
