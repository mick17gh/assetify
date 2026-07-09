import { SettingsNav } from "@/components/settings/settings-nav";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { PERMISSION_KEYS } from "@/constants";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);

  return (
    <div>
      <SettingsNav />
      {children}
    </div>
  );
}
