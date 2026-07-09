"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, QrCode, ScanLine } from "lucide-react";
import { AssetMovementForm } from "@/components/scan/asset-movement-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MovementFormOptions } from "@/lib/qr/asset-scan-profile";
import { parseQrScanValue, type QrLocationType, QR_LOCATION_TYPES } from "@/lib/qr/payload";

type ScannerMode = "asset" | "location" | null;
type ScannerControls = { stop: () => void };

export function QrLocationScanner({
  options,
  initialAssetId,
  initialLocationType,
  initialLocationId,
}: {
  options: MovementFormOptions;
  initialAssetId?: string;
  initialLocationType?: QrLocationType;
  initialLocationId?: string;
}) {
  const [assetId, setAssetId] = useState(initialAssetId ?? "");
  const [locationPrefill, setLocationPrefill] = useState<{ type: QrLocationType; id: string } | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scannerMode, setScannerMode] = useState<ScannerMode>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<ScannerControls | null>(null);

  useEffect(() => {
    if (initialAssetId) setAssetId(initialAssetId);
  }, [initialAssetId]);

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

    const room = parsed.locationType === QR_LOCATION_TYPES.ROOM
      ? options.rooms.find((item) => item.id === parsed.locationId)
      : null;
    const shelf = parsed.locationType === QR_LOCATION_TYPES.SHELF
      ? options.shelves.find((item) => item.id === parsed.locationId)
      : null;

    if (parsed.locationType === QR_LOCATION_TYPES.ROOM && !room) {
      setScanError("Scanned room was not found.");
      return;
    }
    if (parsed.locationType === QR_LOCATION_TYPES.SHELF && !shelf) {
      setScanError("Scanned shelf was not found.");
      return;
    }

    setLocationPrefill({ type: parsed.locationType, id: parsed.locationId });
    setScannerMode(null);
  }

  const selectedAsset = options.assets.find((item) => item.id === assetId);

  return (
    <div className="space-y-4">
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
        </CardContent>
      </Card>

      <AssetMovementForm
        assetId={assetId}
        assetLabel={selectedAsset?.label}
        options={options}
        initialLocationType={initialLocationType}
        initialLocationId={initialLocationId}
        locationPrefill={locationPrefill}
        onAssetIdChange={setAssetId}
        title="Record movement"
        showAssetSelect
      />
    </div>
  );
}
