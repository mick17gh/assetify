"use client";

import {
  createConditionFlagAction,
  createMaintenanceAction,
} from "@/app/(dashboard)/maintenance/actions";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceOption, ReferenceSelect } from "@/components/shared/reference-selects";
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
        <SetupTextField name="description" label="Description" required />
        <SetupTextField name="serviceDate" label="Service date" type="date" required />
        <SetupTextField name="cost" label="Cost" placeholder="0.00" />
        <SetupTextField name="vendorName" label="Vendor name" />
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
        <SetupTextField name="title" label="Issue title" required />
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
