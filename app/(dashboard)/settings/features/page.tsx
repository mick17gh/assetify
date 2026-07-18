import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SubmitButton } from "@/components/shared/submit-button";
import { PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { getRequiredSession } from "@/lib/session";
import { getOrganizationSettings, isQrLocationScanningEnabledFromSettings } from "@/lib/organization-settings";
import { updateFeatureSettingsAction } from "../actions";

async function FeaturesForm() {
  const session = await getRequiredSession();
  const settings = session.organizationId ? await getOrganizationSettings(session.organizationId) : {};
  const qrLocationScanning = isQrLocationScanningEnabledFromSettings(settings);

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardContent className="pt-6">
        <form action={updateFeatureSettingsAction} className="max-w-lg space-y-4">
          <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-purple-950">QR location scanning</p>
                <p className="text-sm text-purple-900/70">
                  Allow scanning asset and location QR codes, and enable printable QR tags.
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="qrLocationScanning"
                  value="true"
                  defaultChecked={qrLocationScanning}
                  className="h-4 w-4 rounded border-purple-300 text-purple-700"
                />
                Enabled
              </label>
            </div>
          </div>
          <SubmitButton idleLabel="Save feature settings" pendingLabel="Saving..." className="cursor-pointer" />
        </form>
      </CardContent>
    </Card>
  );
}

export default function FeatureSettingsPage() {
  return (
    <div>
      <PageHeader title="Features" description="Enable or disable organization-level capabilities." />
      <Suspense fallback={<PageLoading rows={3} />}>
        <FeaturesForm />
      </Suspense>
    </div>
  );
}
