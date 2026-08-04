"use client";

import {
  createConditionFlagAction,
  createMaintenanceAction,
} from "@/app/(dashboard)/maintenance/actions";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceOption, ReferenceSelect } from "@/components/shared/reference-selects";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAINTENANCE_STATUS } from "@/constants";

const CONDITION_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export function MaintenancePageActions({ assets }: { assets: ReferenceOption[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SetupCreateModal title="Log maintenance service" triggerLabel="Log Service" action={createMaintenanceAction}>
        <ReferenceSelect name="assetId" label="Asset" options={assets} required />
        <SetupTextField name="description" label="Description" required minLength={3} maxLength={2000} />
        <SetupTextField name="serviceDate" label="Service date" type="date" required />
        <SetupTextField name="cost" label="Cost" placeholder="0.00" />
        <SetupTextField name="vendorName" label="Vendor name" maxLength={120} />
        <SetupTextField name="nextServiceDate" label="Next service date" type="date" />
        <EnumSelect
          name="status"
          label="Status"
          labelKey="maintenanceStatus"
          values={MAINTENANCE_STATUS}
          defaultValue={MAINTENANCE_STATUS.COMPLETED}
          required
        />
      </SetupCreateModal>
      <SetupCreateModal title="Create condition flag" triggerLabel="Flag Condition" action={createConditionFlagAction}>
        <ReferenceSelect name="assetId" label="Asset" options={assets} required />
        <SetupTextField name="title" label="Issue title" required minLength={2} maxLength={120} />
        <div className="min-w-0 space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" maxLength={2000} placeholder="Additional details (optional)" className="min-w-0" />
        </div>
        <EnumSelect
          name="severity"
          label="Severity"
          labelKey="conditionSeverity"
          values={CONDITION_SEVERITY}
          defaultValue={CONDITION_SEVERITY.MEDIUM}
          required
        />
      </SetupCreateModal>
    </div>
  );
}
