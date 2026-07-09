import { db } from "@/lib/db";
import { ORG_FEATURE_KEYS } from "@/constants";

type ReminderSettings = Record<string, number>;

export type OrganizationSettings = {
  features?: Partial<Record<(typeof ORG_FEATURE_KEYS)[keyof typeof ORG_FEATURE_KEYS], boolean>>;
  reminders?: ReminderSettings;
};

export async function getOrganizationSettings(organizationId: string): Promise<OrganizationSettings> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });
  return (organization?.settings as OrganizationSettings | null) ?? {};
}

export function isQrLocationScanningEnabledFromSettings(settings: OrganizationSettings | null | undefined): boolean {
  return Boolean(settings?.features?.[ORG_FEATURE_KEYS.QR_LOCATION_SCANNING]);
}

export async function isQrLocationScanningEnabled(organizationId: string): Promise<boolean> {
  const settings = await getOrganizationSettings(organizationId);
  return isQrLocationScanningEnabledFromSettings(settings);
}
