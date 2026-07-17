"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createAssetAction } from "@/app/(dashboard)/assets/actions";
import { ASSET_CONDITION, ASSET_STATUS } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { OptionalReferenceSelect, ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type LocationRefs = {
  departments: Array<{ id: string; name: string; branchId: string }>;
  rooms: Array<{ id: string; name: string; branchId: string }>;
  shelves: Array<{ id: string; name: string; roomId: string }>;
};

export function CreateAssetModal({
  branches,
  categories,
  vendors,
  custodians,
  locations,
}: {
  branches: ReferenceOption[];
  categories: ReferenceOption[];
  vendors: ReferenceOption[];
  custodians: ReferenceOption[];
  locations: LocationRefs;
}) {
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [roomId, setRoomId] = useState("");

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
        <Button className="bg-[#7C3AED] hover:bg-[#6D28D9] cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Asset</DialogTitle>
        </DialogHeader>
        <PendingForm
          action={createAssetAction}
          onSuccess={() => setOpen(false)}
          className="grid gap-4 md:grid-cols-2"
        >
          <SetupTextField name="ain" label="AIN" placeholder="AIN-NY-000123" required />
          <SetupTextField name="serialNumber" label="Serial Number" required />
          <SetupTextField name="name" label="Asset Name" required />
          <SetupTextField name="purchaseDate" label="Purchase Date" type="date" required />
          <SetupTextField name="purchaseCost" label="Purchase Cost" required />
          <SetupTextField name="warrantyExpiryDate" label="Warranty Expiry" type="date" />
          <ReferenceSelect name="categoryId" label="Category" options={categories} required />
          <ReferenceSelect
            name="branchId"
            label="Branch"
            options={branches}
            value={branchId}
            onValueChange={setBranchId}
            required
          />
          <OptionalReferenceSelect name="departmentId" label="Department" options={departments} />
          <ReferenceSelect name="roomId" label="Room" options={rooms} value={roomId} onValueChange={setRoomId} />
          <OptionalReferenceSelect name="shelfId" label="Shelf" options={shelves} />
          <OptionalReferenceSelect name="vendorId" label="Vendor" options={vendors} />
          <OptionalReferenceSelect name="custodianId" label="Custodian" options={custodians} />
          <EnumSelect name="status" label="Status" labelKey="assetStatus" values={ASSET_STATUS} defaultValue={ASSET_STATUS.ACTIVE} />
          <EnumSelect name="condition" label="Condition" labelKey="assetCondition" values={ASSET_CONDITION} defaultValue={ASSET_CONDITION.GOOD} />
          <div className="md:col-span-2">
            <SubmitButton idleLabel="Save Asset" pendingLabel="Saving..." className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]" />
          </div>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
