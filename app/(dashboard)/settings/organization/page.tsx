import { PageHeader } from "@/components/shared/page-header";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { updateOrganizationAction } from "../actions";

export default async function OrganizationSettingsPage() {
  const session = await getRequiredSession();
  const organization = session.organizationId
    ? await db.organization.findUnique({ where: { id: session.organizationId } })
    : null;

  return (
    <div>
      <PageHeader title="Organization" description="Manage organization profile and defaults." />
      <Card className="border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <form action={updateOrganizationAction} className="max-w-md space-y-3">
            <SetupTextField name="name" label="Organization name" required defaultValue={organization?.name ?? ""} />
            <SubmitButton idleLabel="Save organization" pendingLabel="Saving..." className="cursor-pointer" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
