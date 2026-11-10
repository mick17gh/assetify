"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createAssetAction } from "@/app/(dashboard)/assets/actions";
import { ASSET_CONDITION, ASSET_STATUS } from "@/constants";
import { ProcurementLeaseFields } from "@/components/assets/procurement-lease-fields";
import { EnumSelect } from "@/components/shared/enum-select";
import { UserLookupSelect, VendorLookupSelect } from "@/components/shared/entity-lookups";
import { OptionalReferenceSelect, ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PickerOption } from "@/lib/lookups/types";

type LocationRefs = {
  departments: Array<{ id: string; name: string; branchId: string }>;
  rooms: Array<{ id: string; name: string; branchId: string }>;
  shelves: Array<{ id: string; name: string; roomId: string }>;
};

export function CreateAssetModal({
  branches,
  regions,
  categories,
  vendorSeed,
  custodianSeed,
  locations,
}: {
  branches: ReferenceOption[];
  regions: ReferenceOption[];
  categories: ReferenceOption[];
  vendorSeed: PickerOption[];
  custodianSeed: PickerOption[];
  locations: LocationRefs;
}) {
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [regionId, setRegionId] = useState("");
  const [roomId, setRoomId] = useState("");
  const visibleBranches = useMemo(
    () => (regionId ? branches.filter((branch) => branch.regionId === regionId) : branches),
    [branches, regionId],
  );

  const departments = useMemo(
    () => locations.departments.filter((d) => d.branchId === branchId).map((d) => ({ id: d.id, label: d.name })),
    [locations.departments, branchId],
  );
  const rooms = useMemo(
    () => locations.rooms.filter((r) => r.branchId === branchId).map((r) => ({ id: r.id, label: r.name })),
    [locations.rooms, branchId],
  );
  const shelves = useMemo(
    () => locations.shelves.filter((s) => s.roomId === roomId).map((s) => ({ id: s.id, label: s.name })),
    [locations.shelves, roomId],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-navy-900 hover:bg-navy-950 cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Asset</DialogTitle>
        </DialogHeader>
        <PendingForm
          action={createAssetAction}
          onSuccess={() => setOpen(false)}
          successMessage="Asset created."
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody className="grid gap-4 pb-2 md:grid-cols-2">
            <SetupTextField name="ain" label="AIN" placeholder="HQ-VEH-000123" required pattern="[A-Za-z0-9-]{4,32}" />
            <SetupTextField name="serialNumber" label="Serial Number" required minLength={1} pattern="[A-Za-z0-9-]{4,50}" />
            <SetupTextField name="name" label="Asset Name" required minLength={1} />
            <SetupTextField name="manufacturer" label="Manufacturer" />
            <SetupTextField name="modelName" label="Model" />
            <SetupTextField name="existingAssetNumber" label="Existing asset number" />
            <SetupTextField name="purchaseDate" label="Purchase Date" type="date" required />
            <SetupTextField name="purchaseCost" label="Purchase Cost" required pattern="^\d+(\.\d{1,2})?$" />
            <SetupTextField name="warrantyExpiryDate" label="Warranty Expiry" type="date" />
            <ProcurementLeaseFields />
            <ReferenceSelect name="categoryId" label="Category" options={categories} required />
            <OptionalReferenceSelect
              name="regionFilter"
              label="Region"
              options={regions}
              value={regionId || "NONE"}
              onValueChange={(value) => {
                const next = value === "NONE" ? "" : value;
                setRegionId(next);
                const allowed = next ? branches.filter((branch) => branch.regionId === next) : branches;
                if (!allowed.some((branch) => branch.id === branchId)) setBranchId(allowed[0]?.id ?? "");
              }}
            />
            <ReferenceSelect
              name="branchId"
              label="Branch"
              options={visibleBranches}
              value={branchId}
              onValueChange={setBranchId}
              required
            />
            <OptionalReferenceSelect name="departmentId" label="Department" options={departments} />
            <ReferenceSelect name="roomId" label="Room" options={rooms} value={roomId} onValueChange={setRoomId} />
            <OptionalReferenceSelect name="shelfId" label="Shelf" options={shelves} />
            <VendorLookupSelect name="vendorId" seed={vendorSeed} allowNone />
            <UserLookupSelect name="custodianId" label="Custodian" seed={custodianSeed} allowNone />
            <EnumSelect
              name="status"
              label="Status"
              labelKey="assetStatus"
              values={ASSET_STATUS}
              defaultValue={ASSET_STATUS.PENDING_ONBOARDING}
            />
            <EnumSelect
              name="condition"
              label="Condition"
              labelKey="assetCondition"
              values={ASSET_CONDITION}
              defaultValue={ASSET_CONDITION.NEW}
            />
          </DialogBody>
          <DialogFooter>
            <SubmitButton
              idleLabel="Save Asset"
              pendingLabel="Saving..."
              className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:w-auto"
            />
          </DialogFooter>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
