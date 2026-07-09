import { PageHeader } from "@/components/shared/page-header";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { REMINDER_TYPE } from "@/constants";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { updateReminderSettingsAction } from "../actions";

export default async function RemindersSettingsPage() {
  const session = await getRequiredSession();
  const organization = session.organizationId
    ? await db.organization.findUnique({ where: { id: session.organizationId } })
    : null;
  const settings = (organization?.settings as { reminders?: Record<string, number> } | null) ?? {};
  const warrantyDays = settings.reminders?.[REMINDER_TYPE.WARRANTY_EXPIRY] ?? 30;

  return (
    <div>
      <PageHeader title="Reminders" description="Configure reminder lead times by type." />
      <Card className="border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <form action={updateReminderSettingsAction} className="max-w-md space-y-3">
            <EnumSelect
              name="reminderType"
              label="Reminder type"
              labelKey="reminderType"
              values={REMINDER_TYPE}
              defaultValue={REMINDER_TYPE.WARRANTY_EXPIRY}
              required
            />
            <SetupTextField name="daysBefore" label="Days before event" type="number" required defaultValue={String(warrantyDays)} />
            <SubmitButton idleLabel="Save reminder settings" pendingLabel="Saving..." className="cursor-pointer" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
