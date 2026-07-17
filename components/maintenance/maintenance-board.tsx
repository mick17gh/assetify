"use client";

import { resolveConditionFlagAction } from "@/app/(dashboard)/maintenance/actions";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENUM_LABELS } from "@/constants/labels";

export { MaintenanceRowActions } from "@/components/maintenance/maintenance-row-actions";

const CONDITION_SEVERITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
} as const;

export function MaintenanceBoard({
  totalRecords,
  openFlags,
  criticalFlags,
  latestFlags,
}: {
  totalRecords: number;
  openFlags: number;
  criticalFlags: number;
  latestFlags: Array<{
    id: string;
    title: string;
    severity: keyof typeof CONDITION_SEVERITY_LABELS;
    assetName: string;
  }>;
}) {
  return (
    <Card className="border-purple-200 shadow-sm">
      {/* <CardHeader>
        <CardTitle>Status and Condition Monitoring</CardTitle>
        <p className="mt-1 text-sm text-purple-900/70">
          Track lifecycle transitions, condition notes, maintenance history, and urgent flags.
        </p>
      </CardHeader> */}
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Metric title="Total maintenance records" value={totalRecords.toLocaleString()} />
          <Metric title="Open condition flags" value={openFlags.toLocaleString()} />
          <Metric title="Critical open flags" value={criticalFlags.toLocaleString()} />
        </div>
        <div className="rounded-lg border border-purple-100 bg-white p-3">
          <p className="mb-2 text-sm font-medium text-purple-950">Latest open flags</p>
          {latestFlags.length === 0 ? (
            <p className="text-sm text-purple-900/65">No unresolved condition flags.</p>
          ) : (
            <div className="space-y-2">
              {latestFlags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between gap-3 rounded-md border border-purple-100 p-2.5">
                  <div className="text-sm">
                    <p className="font-medium text-purple-950">{flag.title}</p>
                    <p className="text-purple-900/70">{flag.assetName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{CONDITION_SEVERITY_LABELS[flag.severity]}</Badge>
                    <PendingForm action={resolveConditionFlagAction} successMessage="Condition flag resolved.">
                      <input type="hidden" name="id" value={flag.id} />
                      <SubmitButton
                        idleLabel="Resolve"
                        pendingLabel="Resolving..."
                        className="h-7 cursor-pointer border-purple-200 bg-white px-2.5 text-xs text-purple-800 shadow-none hover:bg-purple-50"
                      />
                    </PendingForm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-purple-100 bg-purple-50/80 p-3.5">
      <p className="text-xl font-semibold text-[#7C3AED]">{value}</p>
      <p className="text-sm text-purple-900/70">{title}</p>
    </div>
  );
}

export function MaintenanceStatusBadge({ status }: { status: string }) {
  return <Badge variant="secondary">{ENUM_LABELS.maintenanceStatus[status] ?? status}</Badge>;
}
