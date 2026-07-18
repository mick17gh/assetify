import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { updateOrganizationAction } from "../actions";

async function OrganizationForm() {
  const session = await getRequiredSession();
  const organization = session.organizationId
    ? await db.organization.findUnique({ where: { id: session.organizationId } })
    : null;

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardContent className="pt-6">
        <form action={updateOrganizationAction} className="max-w-md space-y-3">
          <SetupTextField name="name" label="Organization name" required defaultValue={organization?.name ?? ""} />
          <SetupTextField
            name="maintenanceCostThresholdPercent"
            label="High maintenance cost threshold (%)"
            type="number"
            required
            defaultValue={String(organization?.maintenanceCostThresholdPercent ?? 50)}
          />
          <p className="text-xs text-purple-900/60">
            Assets are flagged for replacement review when total maintenance cost reaches this percentage of purchase cost.
          </p>
          <SubmitButton idleLabel="Save organization" pendingLabel="Saving..." className="cursor-pointer" />
        </form>
      </CardContent>
    </Card>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <div>
      <PageHeader title="Organization" description="Manage organization profile and defaults." />
      <Suspense fallback={<PageLoading rows={3} />}>
        <OrganizationForm />
      </Suspense>
    </div>
  );
}
