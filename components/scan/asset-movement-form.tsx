"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createAssetMovementAction } from "@/app/(dashboard)/locations/actions";
import { EnumSelect } from "@/components/shared/enum-select";
import { OptionalReferenceSelect, ReferenceSelect } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_ROUTES, FEATURE_FLAGS, MOVEMENT_TYPE } from "@/constants";
import type { BranchRoom, BranchUser, MovementFormOptions, RoomShelf } from "@/lib/qr/asset-scan-profile";
import { movementFromLocationType, type QrLocationType, QR_LOCATION_TYPES } from "@/lib/qr/scan-helpers";
import { enqueueOfflineOperation } from "@/hooks/use-offline-queue";

export function AssetMovementForm({
  assetId,
  assetLabel,
  options,
  initialLocationType,
  initialLocationId,
  locationPrefill,
  redirectTo = APP_ROUTES.LOCATIONS,
  title = "Record movement",
  showAssetSelect = true,
  onAssetIdChange,
}: {
  assetId: string;
  assetLabel?: string;
  options: MovementFormOptions;
  initialLocationType?: QrLocationType;
  initialLocationId?: string;
  locationPrefill?: { type: QrLocationType; id: string } | null;
  redirectTo?: string;
  title?: string;
  showAssetSelect?: boolean;
  onAssetIdChange?: (assetId: string) => void;
}) {
  const router = useRouter();
  const { assets, branches, departments, rooms, shelves, users } = options;
  const [selectedAssetId, setSelectedAssetId] = useState(assetId);
  const [movementType, setMovementType] = useState<string>(MOVEMENT_TYPE.BRANCH_TRANSFER);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [roomId, setRoomId] = useState("");
  const [shelfId, setShelfId] = useState("");
  const [custodianId, setCustodianId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const roomOptions = useMemo(
    () => rooms.filter((room) => room.branchId === branchId).map((room) => ({ id: room.id, label: room.name })),
    [rooms, branchId],
  );
  const shelfOptions = useMemo(
    () => shelves.filter((shelf) => shelf.roomId === roomId).map((shelf) => ({ id: shelf.id, label: shelf.name })),
    [shelves, roomId],
  );
  const userOptions = useMemo(
    () => users.filter((user) => !user.branchId || user.branchId === branchId).map((user) => ({ id: user.id, label: user.name })),
    [users, branchId],
  );
  const departmentOptions = useMemo(
    () => departments.filter((department) => department.branchId === branchId).map((department) => ({ id: department.id, label: department.name })),
    [departments, branchId],
  );

  useEffect(() => {
    setSelectedAssetId(assetId);
  }, [assetId]);

  useEffect(() => {
    if (!initialLocationType || !initialLocationId) return;
    applyLocationScan(initialLocationType, initialLocationId, rooms, shelves);
  }, [initialLocationType, initialLocationId, rooms, shelves]);

  useEffect(() => {
    if (!locationPrefill) return;
    applyLocationScan(locationPrefill.type, locationPrefill.id, rooms, shelves);
  }, [locationPrefill, rooms, shelves]);

  function applyLocationScan(
    locationType: QrLocationType,
    locationId: string,
    roomList: BranchRoom[],
    shelfList: RoomShelf[],
  ) {
    if (locationType === QR_LOCATION_TYPES.BRANCH) {
      setBranchId(locationId);
      setRoomId("");
      setShelfId("");
    } else if (locationType === QR_LOCATION_TYPES.ROOM) {
      const room = roomList.find((item) => item.id === locationId);
      if (room) {
        setBranchId(room.branchId);
        setRoomId(room.id);
        setShelfId("");
      }
    } else {
      const shelf = shelfList.find((item) => item.id === locationId);
      const room = shelf ? roomList.find((item) => item.id === shelf.roomId) : null;
      if (shelf && room) {
        setBranchId(room.branchId);
        setRoomId(room.id);
        setShelfId(shelf.id);
      }
    }
    setMovementType(movementFromLocationType(locationType));
  }

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <PendingForm
          action={async (formData) => {
            if (!navigator.onLine) {
              if (!FEATURE_FLAGS.ENABLE_OFFLINE_MODE) return;
              enqueueOfflineOperation({
                type: "movement.create",
                payload: Object.fromEntries(formData.entries()),
              });
              router.push(redirectTo);
              router.refresh();
              return;
            }
            await createAssetMovementAction(formData);
            router.push(redirectTo);
            router.refresh();
          }}
          successMessage="Movement recorded."
          className="space-y-3"
        >
          {showAssetSelect ? (
            <ReferenceSelect
              name="assetId"
              label="Asset"
              options={assets}
              value={selectedAssetId}
              onValueChange={(value) => {
                setSelectedAssetId(value);
                onAssetIdChange?.(value);
              }}
              required
            />
          ) : (
            <input type="hidden" name="assetId" value={selectedAssetId} />
          )}
          {assetLabel && !showAssetSelect ? (
            <p className="rounded-md bg-purple-50 px-3 py-2 text-sm text-purple-900">{assetLabel}</p>
          ) : null}
          <EnumSelect
            name="movementType"
            label="Movement type"
            labelKey="movementType"
            values={MOVEMENT_TYPE}
            value={movementType}
            onValueChange={setMovementType}
            required
          />
          <ReferenceSelect name="toBranchId" label="Target branch" options={branches} value={branchId} onValueChange={setBranchId} required />
          {movementType === MOVEMENT_TYPE.DEPARTMENT_TRANSFER ? (
            <ReferenceSelect
              name="toDepartmentId"
              label="Target department"
              options={departmentOptions}
              value={departmentId}
              onValueChange={setDepartmentId}
              required
            />
          ) : (
            <OptionalReferenceSelect
              name="toDepartmentId"
              label="Target department"
              options={departmentOptions}
              value={departmentId}
              onValueChange={setDepartmentId}
            />
          )}
          <OptionalReferenceSelect name="toRoomId" label="Target room" options={roomOptions} value={roomId} onValueChange={setRoomId} />
          <OptionalReferenceSelect name="toShelfId" label="Target shelf" options={shelfOptions} value={shelfId} onValueChange={setShelfId} />
          <OptionalReferenceSelect name="toCustodianId" label="Target custodian" options={userOptions} value={custodianId} onValueChange={setCustodianId} />
          <SetupTextField name="note" label="Movement note" placeholder="Reason or context (optional)" />
          <SubmitButton
            idleLabel="Save movement"
            pendingLabel="Saving movement..."
            disabled={!selectedAssetId}
            className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
          />
        </PendingForm>
      </CardContent>
    </Card>
  );
}
