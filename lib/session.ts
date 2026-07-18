import { cache } from "react";
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

const getAuthSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export const getOptionalSession = cache(async (): Promise<AppSession | null> => {
  const session = await getAuthSession();

  if (!session?.user) return null;

  return {
    userId: session.user.id,
    role: (session.user.role as AppSession["role"]) ?? USER_ROLES.STAFF,
    branchId: (session.user.branchId as string | null | undefined) ?? null,
    organizationId: (session.user.organizationId as string | null | undefined) ?? null,
    email: session.user.email,
  };
});

export const getRequiredSession = cache(async (): Promise<AppSession> => {
  const session = await getOptionalSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
});
