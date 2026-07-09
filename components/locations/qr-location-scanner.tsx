"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, QrCode, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { createAssetMovementAction } from "@/app/(dashboard)/locations/actions";
import { EnumSelect } from "@/components/shared/enum-select";
import { OptionalReferenceSelect, type ReferenceOption, ReferenceSelect } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_FLAGS, MOVEMENT_TYPE } from "@/constants";
import { parseQrScanValue, type QrLocationType, QR_LOCATION_TYPES } from "@/lib/qr/payload";
import { enqueueOfflineOperation } from "@/hooks/use-offline-queue";

type BranchRoom = { id: string; name: string; branchId: string };
type RoomShelf = { id: string; name: string; roomId: string };
type BranchUser = { id: string; name: string; branchId: string | null };

type ScannerMode = "asset" | "location" | null;
type ScannerControls = { stop: () => void };

function movementFromLocationType(locationType: QrLocationType): string {
  if (locationType === QR_LOCATION_TYPES.SHELF) return MOVEMENT_TYPE.SHELF_TRANSFER;
  if (locationType === QR_LOCATION_TYPES.ROOM) return MOVEMENT_TYPE.ROOM_TRANSFER;
  return MOVEMENT_TYPE.BRANCH_TRANSFER;
}

export function QrLocationScanner({
  assets,
  branches,
  rooms,
  shelves,
  users,
  initialAssetId,
  initialLocationType,
  initialLocationId,
}: {
  assets: ReferenceOption[];
  branches: ReferenceOption[];
  rooms: BranchRoom[];
  shelves: RoomShelf[];
  users: BranchUser[];
  initialAssetId?: string;
  initialLocationType?: QrLocationType;
  initialLocationId?: string;
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState(initialAssetId ?? "");
  const [movementType, setMovementType] = useState<string>(MOVEMENT_TYPE.BRANCH_TRANSFER);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [roomId, setRoomId] = useState("");
  const [shelfId, setShelfId] = useState("");
  const [custodianId, setCustodianId] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scannerMode, setScannerMode] = useState<ScannerMode>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<ScannerControls | null>(null);

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
  const selectedAsset = useMemo(() => assets.find((item) => item.id === assetId), [assets, assetId]);

  useEffect(() => {
    if (!initialLocationType || !initialLocationId) return;
    if (initialLocationType === QR_LOCATION_TYPES.BRANCH) {
      setBranchId(initialLocationId);
      setRoomId("");
      setShelfId("");
    } else if (initialLocationType === QR_LOCATION_TYPES.ROOM) {
      const room = rooms.find((item) => item.id === initialLocationId);
      if (room) {
        setBranchId(room.branchId);
        setRoomId(room.id);
        setShelfId("");
      }
    } else {
      const shelf = shelves.find((item) => item.id === initialLocationId);
      const room = shelf ? rooms.find((item) => item.id === shelf.roomId) : null;
      if (shelf && room) {
        setBranchId(room.branchId);
        setRoomId(room.id);
        setShelfId(shelf.id);
      }
    }
    setMovementType(movementFromLocationType(initialLocationType));
  }, [initialLocationType, initialLocationId, rooms, shelves]);

  useEffect(() => {
    if (scannerMode !== "asset" && scannerMode !== "location") {
      scannerRef.current?.stop();
      scannerRef.current = null;
      return;
    }

    let canceled = false;
    let mountedControls: ScannerControls | null = null;

    async function startScanner() {
      if (!videoRef.current) return;
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (canceled || !result) return;
          applyScan(result.getText());
        });
        mountedControls = controls;
        scannerRef.current = controls;
      } catch {
        if (!canceled) {
          setScanError("Camera scanner is unavailable in this browser. Use manual scan input.");
          setScannerMode(null);
        }
      }
    }

    void startScanner();
    return () => {
      canceled = true;
      mountedControls?.stop();
      if (scannerRef.current === mountedControls) scannerRef.current = null;
    };
  }, [scannerMode]);

  function applyScan(rawValue: string) {
    const parsed = parseQrScanValue(rawValue);
    if (!parsed) {
      setScanError("QR payload was not recognized.");
      return;
    }
    setScanError(null);

    if (parsed.kind === "asset") {
      setAssetId(parsed.assetId);
      setScannerMode(null);
      return;
    }

    if (parsed.locationType === QR_LOCATION_TYPES.BRANCH) {
      setBranchId(parsed.locationId);
      setRoomId("");
      setShelfId("");
    } else if (parsed.locationType === QR_LOCATION_TYPES.ROOM) {
      const room = rooms.find((item) => item.id === parsed.locationId);
      if (!room) {
        setScanError("Scanned room was not found.");
        return;
      }
      setBranchId(room.branchId);
      setRoomId(room.id);
      setShelfId("");
    } else {
      const shelf = shelves.find((item) => item.id === parsed.locationId);
      const room = shelf ? rooms.find((item) => item.id === shelf.roomId) : null;
      if (!shelf || !room) {
        setScanError("Scanned shelf was not found.");
        return;
      }
      setBranchId(room.branchId);
      setRoomId(room.id);
      setShelfId(shelf.id);
    }

    setMovementType(movementFromLocationType(parsed.locationType));
    setScannerMode(null);
  }

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Hybrid scan flow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Button type="button" variant="outline" className="cursor-pointer border-purple-200" onClick={() => setScannerMode("asset")}>
            <ScanLine className="mr-2 h-4 w-4" />
            Scan asset tag
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer border-purple-200"
            onClick={() => setScannerMode("location")}
            disabled={!assetId}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Scan destination location tag
          </Button>
        </div>

        {scannerMode ? (
          <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3">
            <div className="mb-2 flex items-center justify-between text-sm text-purple-900">
              <span className="font-medium">
                {scannerMode === "asset" ? "Scanning asset tag..." : "Scanning location tag..."}
              </span>
              <Button type="button" variant="ghost" size="sm" className="cursor-pointer" onClick={() => setScannerMode(null)}>
                <CameraOff className="mr-1 h-4 w-4" />
                Stop
              </Button>
            </div>
            <video ref={videoRef} className="w-full rounded-md bg-black/80" />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-purple-200 p-3 text-sm text-purple-900/70">
            <Camera className="mr-2 inline-block h-4 w-4" />
            Camera scanner is idle. You can still paste scanned value manually below.
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={scanInput}
            onChange={(event) => setScanInput(event.target.value)}
            placeholder="Paste scanned QR value"
            className="h-10 flex-1 rounded-md border border-purple-200 px-3 text-sm"
          />
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer"
            onClick={() => {
              applyScan(scanInput);
              setScanInput("");
            }}
          >
            Apply scan
          </Button>
        </div>
        {scanError ? <p className="text-sm text-red-700">{scanError}</p> : null}

        <form
          action={async (formData) => {
            if (!navigator.onLine) {
              if (!FEATURE_FLAGS.ENABLE_OFFLINE_MODE) return;
              enqueueOfflineOperation({
                type: "movement.create",
                payload: Object.fromEntries(formData.entries()),
              });
              router.push("/locations");
              router.refresh();
              return;
            }
            await createAssetMovementAction(formData);
            router.push("/locations");
            router.refresh();
          }}
          className="space-y-3 border-t border-purple-100 pt-4"
        >
          <ReferenceSelect name="assetId" label="Asset" options={assets} value={assetId} onValueChange={setAssetId} required />
          {selectedAsset ? (
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
              <CheckCircle2 className="mr-2 inline-block h-4 w-4" />
              Selected: {selectedAsset.label}
            </div>
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
          <OptionalReferenceSelect name="toRoomId" label="Target room" options={roomOptions} value={roomId} onValueChange={setRoomId} />
          <OptionalReferenceSelect name="toShelfId" label="Target shelf" options={shelfOptions} value={shelfId} onValueChange={setShelfId} />
          <OptionalReferenceSelect name="toCustodianId" label="Target custodian" options={userOptions} value={custodianId} onValueChange={setCustodianId} />
          <SetupTextField name="note" label="Movement note" placeholder="Reason or context (optional)" />
          <SubmitButton
            idleLabel="Save movement"
            pendingLabel="Saving movement..."
            disabled={!assetId}
            className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
          />
        </form>
      </CardContent>
    </Card>
  );
}
