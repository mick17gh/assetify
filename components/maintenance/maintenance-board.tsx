"use client";

import {
  createConditionFlagAction,
  createMaintenanceAction,
  deleteMaintenanceAction,
  resolveConditionFlagAction,
  updateMaintenanceAction,
} from "@/app/(dashboard)/maintenance/actions";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceOption, ReferenceSelect } from "@/components/shared/reference-selects";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { SetupCreateModal } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CONDITION_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

const CONDITION_SEVERITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
} as const;

export function MaintenanceBoard({
  assets,
  totalRecords,
  openFlags,
  criticalFlags,
  latestFlags,
}: {
  assets: ReferenceOption[];
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
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Status and Condition Monitoring</CardTitle>
          <p className="mt-1 text-sm text-purple-900/70">
            Track lifecycle transitions, condition notes, maintenance history, and urgent flags.
          </p>
        </div>
        <div className="flex gap-2">
          <SetupCreateModal title="Log maintenance service" triggerLabel="Log Service" action={createMaintenanceAction}>
            <ReferenceSelect name="assetId" label="Asset" options={assets} required />
            <SetupTextField name="description" label="Description" required />
            <SetupTextField name="serviceDate" label="Service date" type="date" required />
            <SetupTextField name="cost" label="Cost" placeholder="0.00" />
            <SetupTextField name="vendorName" label="Vendor name" />
            <SetupTextField name="nextServiceDate" label="Next service date" type="date" />
          </SetupCreateModal>
          <SetupCreateModal title="Create condition flag" triggerLabel="Flag Condition" action={createConditionFlagAction}>
            <ReferenceSelect name="assetId" label="Asset" options={assets} required />
            <SetupTextField name="title" label="Issue title" required />
            <EnumSelect
              name="severity"
              label="Severity"
              labelKey="recommendationState"
              values={CONDITION_SEVERITY}
              defaultValue={CONDITION_SEVERITY.MEDIUM}
              required
            />
          </SetupCreateModal>
        </div>
      </CardHeader>
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
                    <form action={resolveConditionFlagAction}>
                      <input type="hidden" name="id" value={flag.id} />
                      <SubmitButton
                        idleLabel="Resolve"
                        pendingLabel="Resolving..."
                        className="h-7 cursor-pointer border-purple-200 bg-white px-2.5 text-xs text-purple-800 shadow-none hover:bg-purple-50"
                      />
                    </form>
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

export function MaintenanceRowActions({
  recordId,
  assetId,
  description,
  serviceDate,
  cost,
  vendorName,
  nextServiceDate,
  assets,
}: {
  recordId: string;
  assetId: string;
  description: string;
  serviceDate: string;
  cost: string;
  vendorName: string;
  nextServiceDate: string;
  assets: ReferenceOption[];
}) {
  return (
    <SetupRowActions
      recordId={recordId}
      editTitle="Update maintenance record"
      updateAction={updateMaintenanceAction}
      deleteAction={deleteMaintenanceAction}
      editFields={
        <>
          <ReferenceSelect name="assetId" label="Asset" options={assets} value={assetId} required />
          <SetupTextField name="description" label="Description" required defaultValue={description} />
          <SetupTextField name="serviceDate" label="Service date" type="date" required defaultValue={serviceDate} />
          <SetupTextField name="cost" label="Cost" defaultValue={cost} />
          <SetupTextField name="vendorName" label="Vendor name" defaultValue={vendorName} />
          <SetupTextField name="nextServiceDate" label="Next service date" type="date" defaultValue={nextServiceDate} />
        </>
      }
    />
  );
}
