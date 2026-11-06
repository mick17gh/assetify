import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { EnumSelect } from "@/components/shared/enum-select";
import { ORGANIZATION_INDUSTRY, ORGANIZATION_TYPE } from "@/constants";
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
    <Card className="border-navy-200 shadow-sm">
      <CardContent className="pt-6">
        <form action={updateOrganizationAction} className="grid max-w-3xl gap-3 md:grid-cols-2">
          <SetupTextField name="name" label="Organization name" required defaultValue={organization?.name ?? ""} />
          <EnumSelect
            name="organizationType"
            label="Type"
            labelKey="organizationType"
            values={ORGANIZATION_TYPE}
            defaultValue={organization?.organizationType ?? ""}
          />
          <EnumSelect
            name="industry"
            label="Industry"
            labelKey="organizationIndustry"
            values={ORGANIZATION_INDUSTRY}
            defaultValue={organization?.industry ?? ""}
          />
          <EnumSelect
            name="isActive"
            label="Status"
            labelKey="organizationActive"
            values={{ true: "true", false: "false" }}
            defaultValue={organization?.isActive === false ? "false" : "true"}
            required
          />
          <SetupTextField name="primaryContactName" label="Primary contact" defaultValue={organization?.primaryContactName ?? ""} />
          <SetupTextField name="contactEmail" label="Email" type="email" defaultValue={organization?.contactEmail ?? ""} />
          <SetupTextField name="contactPhone" label="Phone" defaultValue={organization?.contactPhone ?? ""} />
          <SetupTextField name="address" label="Address" defaultValue={organization?.address ?? ""} />
          <SetupTextField
            name="maintenanceCostThresholdPercent"
            label="High maintenance cost threshold (%)"
            type="number"
            required
            defaultValue={String(organization?.maintenanceCostThresholdPercent ?? 50)}
          />
          <p className="text-xs text-navy-900/60 md:col-span-2">
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
