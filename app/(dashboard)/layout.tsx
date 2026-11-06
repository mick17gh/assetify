import { AppShell } from "@/components/shared/app-shell";
import { RoutePermissionGuard } from "@/components/shared/route-permission-guard";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { APP_ROUTES, SHOW_USAGE_MANUAL } from "@/constants";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getRequiredSession();
  } catch {
    redirect(APP_ROUTES.SIGN_IN);
  }
  return (
    <AppShell role={session.role} showUsageManual={SHOW_USAGE_MANUAL}>
      <RoutePermissionGuard role={session.role}>{children}</RoutePermissionGuard>
    </AppShell>
  );
}
