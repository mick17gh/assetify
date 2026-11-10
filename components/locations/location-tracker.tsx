"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createAssetMovementAction } from "@/app/(dashboard)/locations/actions";
import { EnumSelect } from "@/components/shared/enum-select";
import { AssetLookupSelect, UserLookupSelect } from "@/components/shared/entity-lookups";
import { OptionalReferenceSelect, ReferenceOption, ReferenceSelect } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { MOVEMENT_TYPE } from "@/constants";
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
import { MovementExtraFields } from "@/components/locations/movement-extra-fields";
import type { PickerOption } from "@/lib/lookups/types";

type BranchRoom = { id: string; name: string; branchId: string };
type RoomShelf = { id: string; name: string; roomId: string };
type BranchDepartment = { id: string; name: string; branchId: string };

export function LocationTracker({
  assetSeed,
  userSeed,
  branches,
  departments,
  rooms,
  shelves,
}: {
  assetSeed: PickerOption[];
  userSeed: PickerOption[];
  branches: ReferenceOption[];
  departments: BranchDepartment[];
  rooms: BranchRoom[];
  shelves: RoomShelf[];
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
  const departmentOptions = useMemo(
    () => departments.filter((d) => d.branchId === branchId).map((d) => ({ id: d.id, label: d.name })),
    [departments, branchId],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-navy-900 hover:bg-navy-950">
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
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody className="space-y-3 pb-2">
            <AssetLookupSelect name="assetId" seed={assetSeed} required />
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
            <UserLookupSelect name="toCustodianId" label="Target custodian" seed={userSeed} allowNone />
            <MovementExtraFields movementType={movementType} />
            <SetupTextField name="note" label="Movement note" placeholder="Reason or context (optional)" />
          </DialogBody>
          <DialogFooter>
            <SubmitButton
              idleLabel="Save movement"
              pendingLabel="Saving movement..."
              className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:w-auto"
            />
          </DialogFooter>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
