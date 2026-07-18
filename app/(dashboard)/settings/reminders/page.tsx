import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { REMINDER_TYPE } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { getOrganizationSettings } from "@/lib/organization-settings";
import { updateReminderSettingsAction } from "../actions";

async function RemindersForm() {
  const session = await getRequiredSession();
  const settings = session.organizationId ? await getOrganizationSettings(session.organizationId) : {};
  const warrantyDays = settings.reminders?.[REMINDER_TYPE.WARRANTY_EXPIRY] ?? 30;

  return (
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
  );
}

export default function RemindersSettingsPage() {
  return (
    <div>
      <PageHeader title="Reminders" description="Configure reminder lead times by type." />
      <Suspense fallback={<PageLoading rows={3} />}>
        <RemindersForm />
      </Suspense>
    </div>
  );
}
