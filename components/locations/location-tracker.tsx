"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createAssetMovementAction } from "@/app/(dashboard)/locations/actions";
import { EnumSelect } from "@/components/shared/enum-select";
import { OptionalReferenceSelect, ReferenceOption, ReferenceSelect } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { MOVEMENT_TYPE } from "@/constants";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type BranchRoom = { id: string; name: string; branchId: string };
type RoomShelf = { id: string; name: string; roomId: string };
type BranchUser = { id: string; name: string; branchId: string | null };
type BranchDepartment = { id: string; name: string; branchId: string };

export function LocationTracker({
  assets,
  branches,
  departments,
  rooms,
  shelves,
  users,
}: {
  assets: ReferenceOption[];
  branches: ReferenceOption[];
  departments: BranchDepartment[];
  rooms: BranchRoom[];
  shelves: RoomShelf[];
  users: BranchUser[];
}) {
  const [open, setOpen] = useState(false);
  const [movementType, setMovementType] = useState<string>(MOVEMENT_TYPE.BRANCH_TRANSFER);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [roomId, setRoomId] = useState("");

  const roomOptions = useMemo(
    () => rooms.filter((room) => room.branchId === branchId).map((room) => ({ id: room.id, label: room.name })),
    [rooms, branchId],
  );
  const shelfOptions = useMemo(
    () => shelves.filter((shelf) => shelf.roomId === roomId).map((shelf) => ({ id: shelf.id, label: shelf.name })),
    [shelves, roomId],
  );
  const userOptions = useMemo(
    () =>
      users
        .filter((user) => !user.branchId || user.branchId === branchId)
        .map((user) => ({ id: user.id, label: user.name })),
    [users, branchId],
  );
  const departmentOptions = useMemo(
    () => departments.filter((d) => d.branchId === branchId).map((d) => ({ id: d.id, label: d.name })),
    [departments, branchId],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="mr-2 h-4 w-4" />
          Record Movement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Asset Movement</DialogTitle>
        </DialogHeader>
        <PendingForm
          action={createAssetMovementAction}
          onSuccess={() => setOpen(false)}
          successMessage="Movement recorded."
          className="space-y-3"
        >
          <ReferenceSelect name="assetId" label="Asset" options={assets} required />
          <EnumSelect
            name="movementType"
            label="Movement type"
            labelKey="movementType"
            values={MOVEMENT_TYPE}
            defaultValue={MOVEMENT_TYPE.BRANCH_TRANSFER}
            onValueChange={setMovementType}
            required
          />
          <ReferenceSelect
            name="toBranchId"
            label="Target branch"
            options={branches}
            value={branchId}
            onValueChange={setBranchId}
            required={movementType === MOVEMENT_TYPE.BRANCH_TRANSFER}
          />
          {movementType === MOVEMENT_TYPE.DEPARTMENT_TRANSFER ? (
            <ReferenceSelect
              name="toDepartmentId"
              label="Target department"
              options={departmentOptions}
              required
            />
          ) : (
            <OptionalReferenceSelect name="toDepartmentId" label="Target department" options={departmentOptions} />
          )}
          <OptionalReferenceSelect name="toRoomId" label="Target room" options={roomOptions} value={roomId} onValueChange={setRoomId} />
          <OptionalReferenceSelect name="toShelfId" label="Target shelf" options={shelfOptions} />
          <OptionalReferenceSelect name="toCustodianId" label="Target custodian" options={userOptions} />
          <SetupTextField name="note" label="Movement note" placeholder="Reason or context (optional)" />
          <SubmitButton
            idleLabel="Save movement"
            pendingLabel="Saving movement..."
            className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
          />
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
