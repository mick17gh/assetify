import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/constants";

export type AppSession = {
  userId: string;
  role: (typeof USER_ROLES)[keyof typeof USER_ROLES];
  branchId: string | null;
  organizationId: string | null;
  email: string;
};

export async function getOptionalSession(): Promise<AppSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return {
    userId: session.user.id,
    role: (session.user.role as AppSession["role"]) ?? USER_ROLES.STAFF,
    branchId: (session.user.branchId as string | null | undefined) ?? null,
    organizationId: (session.user.organizationId as string | null | undefined) ?? null,
    email: session.user.email,
  };
}

export async function getRequiredSession(): Promise<AppSession> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    userId: session.user.id,
    role: (session.user.role as AppSession["role"]) ?? USER_ROLES.STAFF,
    branchId: (session.user.branchId as string | null | undefined) ?? null,
    organizationId: (session.user.organizationId as string | null | undefined) ?? null,
    email: session.user.email,
  };
}
