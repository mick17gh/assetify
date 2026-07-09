"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants";
import { getPermissionForPath } from "@/lib/route-permissions";
import { hasPermission, type Role } from "@/lib/permissions";

export function RoutePermissionGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const permission = getPermissionForPath(pathname);
    if (permission && !hasPermission(role, permission)) {
      router.replace(APP_ROUTES.DASHBOARD);
    }
  }, [pathname, role, router]);

  return <>{children}</>;
}
