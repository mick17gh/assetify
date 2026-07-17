import { NextResponse } from "next/server";
import { API_ROUTES, FEATURE_FLAGS, PERMISSION_KEYS, RATE_LIMIT } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  getDepartmentCostReport,
  getDisposalReport,
  getEndOfLifeValuationReport,
  getReplacementDueReport,
} from "@/lib/reports";
import { assertPermission, hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { buildExcelReport, buildPdfReport } from "@/lib/export/report-export";

export const runtime = "nodejs";

const FINANCE_REPORTS = new Set(["department-cost", "disposal-summary", "end-of-life-valuation"]);

export async function GET(request: Request) {
  const session = await getRequiredSession();
  const url = new URL(request.url);
  const report = url.searchParams.get("report") ?? "replacement";
  const format = url.searchParams.get("format") ?? "excel";

  if (FINANCE_REPORTS.has(report)) {
    assertPermission(session.role, PERMISSION_KEYS.FINANCE_READ);
  } else {
    assertPermission(session.role, PERMISSION_KEYS.REPORT_READ);
  }

  assertRateLimit(`${API_ROUTES.EXPORT_REPORTS}:${session.userId}`, RATE_LIMIT.EXPORT_MAX);

  if (format === "pdf" && !FEATURE_FLAGS.ENABLE_PDF_EXPORT) {
    return NextResponse.json({ error: "PDF export disabled" }, { status: 400 });
  }
  if (format === "excel" && !FEATURE_FLAGS.ENABLE_EXCEL_EXPORT) {
    return NextResponse.json({ error: "Excel export disabled" }, { status: 400 });
  }

  const dateStamp = new Date().toISOString().slice(0, 10);

  if (report === "department-cost") {
    const rows = await getDepartmentCostReport(session);
    await writeAuditLog({
      actorUserId: session.userId,
      organizationId: session.organizationId,
      branchId: session.branchId,
      action: "reports.export",
      entityType: "DepartmentCost",
      metadata: { format, count: rows.length, report },
    });

    if (format === "excel") {
      const buffer = await buildExcelReport(
        "Department Cost",
        [
          { header: "Department", key: "department", width: 28 },
          { header: "Branch", key: "branch", width: 24 },
          { header: "Assets", key: "assets", width: 12 },
          { header: "Total Cost (GHS)", key: "cost", width: 20 },
        ],
        rows.map((r) => ({
          department: r.departmentName,
          branch: r.branchName,
          assets: r.assetCount,
          cost: r.totalCost,
        })),
      );
      return fileResponse(buffer, `department-cost-${dateStamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    const lines = rows.map(
      (r) => `${r.departmentName} | ${r.branchName} | ${r.assetCount} assets | GHS ${r.totalCost.toLocaleString()}`,
    );
    const buffer = await buildPdfReport("Assetify Department Cost Report", lines);
    return fileResponse(buffer, `department-cost-${dateStamp}.pdf`, "application/pdf");
  }

  if (report === "disposal-summary") {
    const { records, summary } = await getDisposalReport(session);
    await writeAuditLog({
      actorUserId: session.userId,
      organizationId: session.organizationId,
      branchId: session.branchId,
      action: "reports.export",
      entityType: "AssetDisposalRecord",
      metadata: { format, count: records.length, report },
    });

    if (format === "excel") {
      const buffer = await buildExcelReport(
        "Disposal Summary",
        [
          { header: "Method", key: "method", width: 16 },
          { header: "Count", key: "count", width: 10 },
          { header: "Purchase Value Removed", key: "purchase", width: 24 },
          { header: "Sale Proceeds", key: "sales", width: 18 },
        ],
        summary.map((r) => ({
          method: r.method,
          count: r.count,
          purchase: r.totalPurchaseValue,
          sales: r.totalSaleProceeds,
        })),
      );
      return fileResponse(buffer, `disposal-summary-${dateStamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    const lines = [
      ...summary.map(
        (r) => `${r.method}: ${r.count} assets | removed GHS ${r.totalPurchaseValue.toLocaleString()} | sales GHS ${r.totalSaleProceeds.toLocaleString()}`,
      ),
      "---",
      ...records.map(
        (r) => `${r.asset.ain} | ${r.method} | ${r.disposalDate.toISOString().slice(0, 10)} | ${r.reason.slice(0, 40)}`,
      ),
    ];
    const buffer = await buildPdfReport("Assetify Disposal Summary", lines);
    return fileResponse(buffer, `disposal-summary-${dateStamp}.pdf`, "application/pdf");
  }

  if (report === "end-of-life-valuation") {
    const rows = await getEndOfLifeValuationReport(session);
    await writeAuditLog({
      actorUserId: session.userId,
      organizationId: session.organizationId,
      branchId: session.branchId,
      action: "reports.export",
      entityType: "EndOfLifeValuation",
      metadata: { format, count: rows.length, report },
    });

    if (format === "excel") {
      const buffer = await buildExcelReport(
        "End of Life Valuation",
        [
          { header: "Asset", key: "asset", width: 28 },
          { header: "AIN", key: "ain", width: 18 },
          { header: "Branch", key: "branch", width: 20 },
          { header: "State", key: "state", width: 14 },
          { header: "Purchase Cost", key: "purchase", width: 16 },
          { header: "Current Value", key: "current", width: 16 },
          { header: "Recommended Sale", key: "sale", width: 18 },
        ],
        rows.map((r) => ({
          asset: r.assetName,
          ain: r.ain,
          branch: r.branchName,
          state: r.state,
          purchase: r.purchaseCost,
          current: r.currentValue,
          sale: r.recommendedSalePrice,
        })),
      );
      return fileResponse(buffer, `end-of-life-valuation-${dateStamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    const lines = rows.map(
      (r) =>
        `${r.ain} | ${r.assetName} | ${r.state} | purchase GHS ${r.purchaseCost.toLocaleString()} | FMV GHS ${r.currentValue.toLocaleString()}`,
    );
    const buffer = await buildPdfReport("Assetify End-of-Life Valuation Report", lines);
    return fileResponse(buffer, `end-of-life-valuation-${dateStamp}.pdf`, "application/pdf");
  }

  // Default: replacement due
  if (!hasPermission(session.role, PERMISSION_KEYS.REPORT_READ)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await getReplacementDueReport(session);
  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "reports.export",
    entityType: "ReplacementEvaluation",
    metadata: { format, count: rows.length, report: "replacement" },
  });

  if (format === "excel") {
    const buffer = await buildExcelReport(
      "Replacement Due",
      [
        { header: "Asset", key: "asset", width: 30 },
        { header: "AIN", key: "ain", width: 20 },
        { header: "Branch", key: "branch", width: 24 },
        { header: "State", key: "state", width: 14 },
        { header: "Recommended Replace Date", key: "replaceDate", width: 24 },
        { header: "Estimated Cost (GHS)", key: "cost", width: 20 },
      ],
      rows.map((row) => ({
        asset: row.asset.name,
        ain: row.asset.ain,
        branch: row.asset.branch.name,
        state: row.state,
        replaceDate: row.recommendedReplaceDate.toISOString().slice(0, 10),
        cost: Number(row.estimatedReplacementCost),
      })),
    );
    return fileResponse(buffer, `replacement-report-${dateStamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  const lines = rows.map(
    (row) =>
      `${row.asset.ain} | ${row.asset.name} | ${row.state} | GHS ${Number(row.estimatedReplacementCost).toLocaleString()}`,
  );
  const buffer = await buildPdfReport("Assetify Replacement Report", lines);
  return fileResponse(buffer, `replacement-report-${dateStamp}.pdf`, "application/pdf");
}

function fileResponse(buffer: Buffer, filename: string, contentType: string) {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
