import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { API_ROUTES, FEATURE_FLAGS, PERMISSION_KEYS, RATE_LIMIT } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { getReplacementDueReport } from "@/lib/reports";
import { assertPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.REPORT_READ);
  assertRateLimit(`${API_ROUTES.EXPORT_REPORTS}:${session.userId}`, RATE_LIMIT.EXPORT_MAX);

  const rows = await getReplacementDueReport(session);
  const format = new URL(request.url).searchParams.get("format") ?? "excel";

  if (format === "pdf" && !FEATURE_FLAGS.ENABLE_PDF_EXPORT) {
    return NextResponse.json({ error: "PDF export disabled" }, { status: 400 });
  }

  if (format === "excel" && !FEATURE_FLAGS.ENABLE_EXCEL_EXPORT) {
    return NextResponse.json({ error: "Excel export disabled" }, { status: 400 });
  }

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "reports.export",
    entityType: "ReplacementEvaluation",
    metadata: { format, count: rows.length },
  });

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Replacement Due");
    worksheet.columns = [
      { header: "Asset", key: "asset", width: 30 },
      { header: "AIN", key: "ain", width: 20 },
      { header: "Branch", key: "branch", width: 24 },
      { header: "State", key: "state", width: 14 },
      { header: "Recommended Replace Date", key: "replaceDate", width: 24 },
      { header: "Estimated Cost (GHS)", key: "cost", width: 20 },
    ];
    rows.forEach((row) => {
      worksheet.addRow({
        asset: row.asset.name,
        ain: row.asset.ain,
        branch: row.asset.branch.name,
        state: row.state,
        replaceDate: row.recommendedReplaceDate.toISOString().slice(0, 10),
        cost: Number(row.estimatedReplacementCost),
      });
    });
    const fileBuffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="replacement-report-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("Assetify Replacement Report", {
    x: 40,
    y: 560,
    size: 20,
    font,
  });
  page.drawText(`Generated: ${new Date().toLocaleString()}`, {
    x: 40,
    y: 540,
    size: 10,
    font,
  });

  let y = 515;
  const maxRows = 22;
  for (const row of rows.slice(0, maxRows)) {
    const line = `${row.asset.ain} | ${row.asset.name} | ${row.state} | GHS ${Number(row.estimatedReplacementCost).toLocaleString()}`;
    page.drawText(line.slice(0, 115), { x: 40, y, size: 10, font });
    y -= 20;
  }
  if (rows.length > maxRows) {
    page.drawText(`...and ${rows.length - maxRows} more rows`, { x: 40, y: 50, size: 10, font });
  }

  const fileBuffer = await pdf.save();
  return new NextResponse(Buffer.from(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="replacement-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
