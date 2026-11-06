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
    notes?: string | null;
    severity: keyof typeof CONDITION_SEVERITY_LABELS;
    assetName: string;
  }>;
}) {
  return (
    <Card className="border-navy-200 shadow-sm">
      <CardHeader>
        <CardTitle>Status and Condition Monitoring</CardTitle>
        <p className="mt-1 text-sm text-navy-900/70">
          Track lifecycle transitions, condition notes, maintenance history, and urgent flags.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Metric title="Total maintenance records" value={totalRecords.toLocaleString()} />
          <Metric title="Open condition flags" value={openFlags.toLocaleString()} />
          <Metric title="Critical open flags" value={criticalFlags.toLocaleString()} />
        </div>
        <div className="rounded-lg border border-navy-100 bg-white p-3">
          <p className="mb-2 text-sm font-medium text-navy-950">Latest open flags</p>
          {latestFlags.length === 0 ? (
            <p className="text-sm text-navy-900/65">No unresolved condition flags.</p>
          ) : (
            <div className="space-y-2">
              {latestFlags.map((flag) => (
                <div key={flag.id} className="flex flex-col gap-2 rounded-md border border-navy-100 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-navy-950">{flag.title}</p>
                    <p className="text-navy-900/70">{flag.assetName}</p>
                    {flag.notes ? <p className="mt-1 text-navy-900/60">{flag.notes}</p> : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Badge variant="secondary">{CONDITION_SEVERITY_LABELS[flag.severity]}</Badge>
                    <PendingForm action={resolveConditionFlagAction} successMessage="Condition flag resolved." className="sm:w-auto">
                      <input type="hidden" name="id" value={flag.id} />
                      <SubmitButton
                        idleLabel="Resolve"
                        pendingLabel="Resolving..."
                        className="h-10 cursor-pointer border-navy-200 bg-white px-3 text-navy-800 shadow-none hover:bg-navy-50 sm:h-7 sm:px-2.5 sm:text-xs"
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
    <div className="rounded-lg border border-navy-100 bg-navy-50/80 p-3.5">
      <p className="text-xl font-semibold text-navy-900">{value}</p>
      <p className="text-sm text-navy-900/70">{title}</p>
    </div>
  );
}

export function MaintenanceStatusBadge({ status }: { status: string }) {
  return <Badge variant="secondary">{ENUM_LABELS.maintenanceStatus[status] ?? status}</Badge>;
}
