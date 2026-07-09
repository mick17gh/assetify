import { NextResponse } from "next/server";
import { PERMISSION_KEYS } from "@/constants";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { buildAssetImportTemplateCsv } from "@/lib/import-template";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getRequiredSession();
    assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

    const csv = buildAssetImportTemplateCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="asset-import-template.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to download import template" }, { status: 500 });
  }
}
