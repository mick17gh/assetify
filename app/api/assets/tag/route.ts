import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PERMISSION_KEYS } from "@/constants";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import { buildAssetQrUrl } from "@/lib/qr/payload";
import { getRequiredSession } from "@/lib/session";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";

export const runtime = "nodejs";

const TAG_WIDTH = 220;
const TAG_HEIGHT = 100;
const TAGS_PER_PAGE = 20;

function parseAssetIds(url: URL): string[] {
  const single = url.searchParams.get("assetId");
  const many = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return single ? [single] : many.slice(0, TAGS_PER_PAGE);
}

function truncate(text: string, max = 28): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export async function GET(request: Request) {
  try {
    const session = await getRequiredSession();
    assertPermission(session.role, PERMISSION_KEYS.ASSET_READ);
    if (!session.organizationId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const enabled = await isQrLocationScanningEnabled(session.organizationId);
    if (!enabled) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const requestUrl = new URL(request.url);
    const ids = parseAssetIds(requestUrl);
    if (ids.length === 0) return NextResponse.json({ error: "assetId or ids query param required" }, { status: 400 });

    const assets = await db.asset.findMany({
      where: { id: { in: ids }, organizationId: session.organizationId },
      select: { id: true, ain: true, name: true, branch: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    });

    if (assets.length === 0) return NextResponse.json({ error: "No matching assets found" }, { status: 404 });

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const marginX = 24;
    const marginY = 24;
    const gapX = 18;
    const gapY = 14;
    const pageWidth = marginX * 2 + TAG_WIDTH * 2 + gapX;
    const pageHeight = marginY * 2 + TAG_HEIGHT * 10 + gapY * 9;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;

    for (const [index, asset] of assets.entries()) {
      const pageIndex = Math.floor(index / TAGS_PER_PAGE);
      const withinPage = index % TAGS_PER_PAGE;
      const col = withinPage % 2;
      const row = Math.floor(withinPage / 2);
      while (pdf.getPageCount() <= pageIndex) pdf.addPage([pageWidth, pageHeight]);
      const page = pdf.getPage(pageIndex);

      const x = marginX + col * (TAG_WIDTH + gapX);
      const y = pageHeight - marginY - TAG_HEIGHT - row * (TAG_HEIGHT + gapY);

      page.drawRectangle({ x, y, width: TAG_WIDTH, height: TAG_HEIGHT, borderWidth: 1, borderColor: rgb(0.77, 0.74, 0.9) });

      const qrValue = buildAssetQrUrl(asset.id, baseUrl);
      const qrDataUrl = await QRCode.toDataURL(qrValue, { margin: 0, width: 160 });
      const pngBytes = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
      const qrImage = await pdf.embedPng(pngBytes);
      page.drawImage(qrImage, { x: x + 8, y: y + 10, width: 80, height: 80 });

      page.drawText(asset.ain, { x: x + 96, y: y + 70, size: 11, font: fontBold });
      page.drawText(truncate(asset.name, 30), { x: x + 96, y: y + 52, size: 9, font });
      page.drawText(`Branch: ${truncate(asset.branch.name, 20)}`, { x: x + 96, y: y + 34, size: 8, font });
      page.drawText("Assetify QR Tag", { x: x + 96, y: y + 18, size: 8, font });
    }

    const buffer = await pdf.save();
    const filename = `asset-tags-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate asset tags" }, { status: 500 });
  }
}
