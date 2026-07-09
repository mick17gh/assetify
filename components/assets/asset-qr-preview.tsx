import Image from "next/image";
import QRCode from "qrcode";
import { buildAssetQrUrl } from "@/lib/qr/payload";

export async function AssetQrPreview({
  assetId,
  ain,
  branchName,
}: {
  assetId: string;
  ain: string;
  branchName: string;
}) {
  const scanUrl = buildAssetQrUrl(assetId);
  const dataUrl = await QRCode.toDataURL(scanUrl, { margin: 1, width: 220 });

  return (
    <div className="rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-purple-900/60">Asset QR</p>
      <div className="flex items-start gap-3">
        <Image
          src={dataUrl}
          alt={`QR code for ${ain}`}
          width={110}
          height={110}
          unoptimized
          className="rounded-md border border-purple-100 bg-white p-1"
        />
        <div className="min-w-0 space-y-1 text-xs text-purple-900/75">
          <p>
            <span className="font-medium text-purple-950">AIN:</span> {ain}
          </p>
          <p>
            <span className="font-medium text-purple-950">Branch:</span> {branchName}
          </p>
          <p className="break-all text-[11px] leading-relaxed text-purple-900/60">{scanUrl}</p>
        </div>
      </div>
    </div>
  );
}
