import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PERMISSION_KEYS } from "@/constants";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import { buildLocationQrUrl, type QrLocationType, QR_LOCATION_TYPES } from "@/lib/qr/payload";
import { getRequiredSession } from "@/lib/session";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";

export const runtime = "nodejs";

type LocationTag = { id: string; name: string; type: QrLocationType };

function parseType(input: string | null): QrLocationType | null {
  if (!input) return null;
  if (input === QR_LOCATION_TYPES.BRANCH || input === QR_LOCATION_TYPES.ROOM || input === QR_LOCATION_TYPES.SHELF) return input;
  return null;
}

async function getTagData(organizationId: string, type: QrLocationType, id: string): Promise<LocationTag | null> {
  if (type === QR_LOCATION_TYPES.BRANCH) {
    const branch = await db.branch.findFirst({ where: { id, organizationId }, select: { id: true, name: true } });
    return branch ? { ...branch, type } : null;
  }
  if (type === QR_LOCATION_TYPES.ROOM) {
    const room = await db.room.findFirst({
      where: { id, branch: { organizationId } },
      select: { id: true, name: true },
    });
    return room ? { ...room, type } : null;
  }
  const shelf = await db.shelf.findFirst({
    where: { id, room: { branch: { organizationId } } },
    select: { id: true, name: true },
  });
  return shelf ? { ...shelf, type } : null;
}

export async function GET(request: Request) {
  try {
    const session = await getRequiredSession();
    assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
    if (!session.organizationId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const enabled = await isQrLocationScanningEnabled(session.organizationId);
    if (!enabled) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const requestUrl = new URL(request.url);
    const locationType = parseType(requestUrl.searchParams.get("type"));
    const locationId = requestUrl.searchParams.get("id");
    if (!locationType || !locationId) return NextResponse.json({ error: "type and id are required" }, { status: 400 });

    const location = await getTagData(session.organizationId, locationType, locationId);
    if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([260, 130]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
    const qrDataUrl = await QRCode.toDataURL(buildLocationQrUrl(location.type, location.id, baseUrl), { margin: 0, width: 180 });
    const qrImage = await pdf.embedPng(Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64"));

    page.drawRectangle({ x: 10, y: 10, width: 240, height: 110, borderWidth: 1, borderColor: rgb(0.72, 0.67, 0.9) });
    page.drawImage(qrImage, { x: 18, y: 22, width: 90, height: 90 });
    page.drawText(location.type.toUpperCase(), { x: 118, y: 86, size: 10, font: fontBold });
    page.drawText(location.name.slice(0, 28), { x: 118, y: 66, size: 11, font: fontBold });
    page.drawText("Assetify location QR", { x: 118, y: 46, size: 9, font });
    page.drawText("Scan in Locations > QR Location Scan", { x: 118, y: 28, size: 7.5, font });

    const buffer = await pdf.save();
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="location-tag-${location.type}-${location.id}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate location tag" }, { status: 500 });
  }
}
