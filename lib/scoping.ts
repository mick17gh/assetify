import { Prisma } from "@/lib/generated/prisma/client";
import { USER_ROLES } from "@/constants";
import type { AppSession } from "@/lib/session";

export function getAssetScopeWhere(session: AppSession): Prisma.AssetWhereInput {
  if (session.role === USER_ROLES.ADMIN) {
    return session.organizationId ? { organizationId: session.organizationId } : {};
  }
  return {
    organizationId: session.organizationId ?? undefined,
    branchId: session.branchId ?? undefined,
  };
}

export function getUserScopeWhere(session: AppSession): Prisma.UserWhereInput {
  if (session.role === USER_ROLES.ADMIN) {
    return session.organizationId ? { organizationId: session.organizationId } : {};
  }
  return {
    organizationId: session.organizationId ?? undefined,
    branchId: session.branchId ?? undefined,
  };
}
