import { NextResponse } from "next/server";
import { API_ROUTES, FEATURE_FLAGS, PERMISSION_KEYS, RATE_LIMIT } from "@/constants";
import { getRequiredSession } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  buildExportTruncationNote,
  getDepartmentCostReport,
  getDisposalRecordsExport,
  getDisposalSummaryReport,
  getEndOfLifeValuationExport,
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

    const columns = [
      { header: "Department", key: "department", width: 28 },
      { header: "Branch", key: "branch", width: 24 },
      { header: "Assets", key: "assets", width: 12 },
      { header: "Total Cost (GHS)", key: "cost", width: 20 },
    ];
    const note = buildExportTruncationNote(false, rows.length, rows.length);

    if (format === "excel") {
      const buffer = await buildExcelReport(
        "Department Cost",
        columns,
        rows.map((r) => ({
          department: r.departmentName,
          branch: r.branchName,
          assets: r.assetCount,
          cost: r.totalCost,
        })),
        { note },
      );
      return fileResponse(buffer, `department-cost-${dateStamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    const buffer = await buildPdfReport(
      "Assetify Department Cost Report",
      columns,
      rows.map((r) => ({
        department: r.departmentName,
        branch: r.branchName,
        assets: r.assetCount,
        cost: r.totalCost.toLocaleString(),
      })),
      { note },
    );
    return fileResponse(buffer, `department-cost-${dateStamp}.pdf`, "application/pdf");
  }

  if (report === "disposal-summary") {
    const [summary, exportResult] = await Promise.all([
      getDisposalSummaryReport(session),
      getDisposalRecordsExport(session),
    ]);
    const { records, totalCount, truncated } = exportResult;
    const note = buildExportTruncationNote(truncated, totalCount, records.length);

    await writeAuditLog({
      actorUserId: session.userId,
      organizationId: session.organizationId,
      branchId: session.branchId,
      action: "reports.export",
      entityType: "AssetDisposalRecord",
      metadata: { format, count: records.length, totalCount, truncated, report },
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
        { note },
      );
      return fileResponse(buffer, `disposal-summary-${dateStamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    const columns = [
      { header: "AIN", key: "ain", width: 18 },
      { header: "Asset", key: "asset", width: 24 },
      { header: "Method", key: "method", width: 14 },
      { header: "Date", key: "date", width: 14 },
      { header: "Purchase Value", key: "purchase", width: 16 },
      { header: "Sale Price", key: "sale", width: 14 },
      { header: "Reason", key: "reason", width: 28 },
    ];
    const data = records.map((r) => ({
      ain: r.asset.ain,
      asset: r.asset.name,
      method: r.method,
      date: r.disposalDate.toISOString().slice(0, 10),
      purchase: Number(r.asset.purchaseCost).toLocaleString(),
      sale: r.salePrice != null ? Number(r.salePrice).toLocaleString() : "—",
      reason: r.reason,
    }));
    const buffer = await buildPdfReport("Assetify Disposal Summary", columns, data, { note });
    return fileResponse(buffer, `disposal-summary-${dateStamp}.pdf`, "application/pdf");
  }

  if (report === "end-of-life-valuation") {
    const { rows, totalCount, truncated } = await getEndOfLifeValuationExport(session);
    const note = buildExportTruncationNote(truncated, totalCount, rows.length);

    await writeAuditLog({
      actorUserId: session.userId,
      organizationId: session.organizationId,
      branchId: session.branchId,
      action: "reports.export",
      entityType: "EndOfLifeValuation",
      metadata: { format, count: rows.length, totalCount, truncated, report },
    });

    const columns = [
      { header: "Asset", key: "asset", width: 28 },
      { header: "AIN", key: "ain", width: 18 },
      { header: "Branch", key: "branch", width: 20 },
      { header: "State", key: "state", width: 14 },
      { header: "Purchase Cost", key: "purchase", width: 16 },
      { header: "Current Value", key: "current", width: 16 },
      { header: "Recommended Sale", key: "sale", width: 18 },
    ];
    const excelData = rows.map((r) => ({
      asset: r.assetName,
      ain: r.ain,
      branch: r.branchName,
      state: r.state,
      purchase: r.purchaseCost,
      current: r.currentValue,
      sale: r.recommendedSalePrice,
    }));

    if (format === "excel") {
      const buffer = await buildExcelReport("End of Life Valuation", columns, excelData, { note });
      return fileResponse(buffer, `end-of-life-valuation-${dateStamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    const buffer = await buildPdfReport(
      "Assetify End-of-Life Valuation Report",
      columns,
      excelData.map((r) => ({
        ...r,
        purchase: Number(r.purchase).toLocaleString(),
        current: Number(r.current).toLocaleString(),
        sale: Number(r.sale).toLocaleString(),
      })),
      { note },
    );
    return fileResponse(buffer, `end-of-life-valuation-${dateStamp}.pdf`, "application/pdf");
  }

  if (!hasPermission(session.role, PERMISSION_KEYS.REPORT_READ)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stateFilter = url.searchParams.get("state") ?? undefined;
  const qFilter = url.searchParams.get("q") ?? undefined;
  const { rows, totalCount, truncated } = await getReplacementDueReport(session, { state: stateFilter, q: qFilter });
  const note = buildExportTruncationNote(truncated, totalCount, rows.length);

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "reports.export",
    entityType: "ReplacementEvaluation",
    metadata: { format, count: rows.length, totalCount, truncated, report: "replacement", state: stateFilter ?? null, q: qFilter ?? null },
  });

  const columns = [
    { header: "Asset", key: "asset", width: 28 },
    { header: "AIN", key: "ain", width: 18 },
    { header: "Branch", key: "branch", width: 20 },
    { header: "State", key: "state", width: 14 },
    { header: "Replace Date", key: "replaceDate", width: 16 },
    { header: "Estimated Cost (GHS)", key: "cost", width: 18 },
  ];
  const excelData = rows.map((row) => ({
    asset: row.asset.name,
    ain: row.asset.ain,
    branch: row.asset.branch.name,
    state: row.state,
    replaceDate: row.recommendedReplaceDate.toISOString().slice(0, 10),
    cost: Number(row.estimatedReplacementCost),
  }));

  const titleSuffix = stateFilter ? ` (${stateFilter})` : "";

  if (format === "excel") {
    const buffer = await buildExcelReport("Replacement Due", columns, excelData, { note });
    return fileResponse(buffer, `replacement-report-${dateStamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  const buffer = await buildPdfReport(
    `Assetify Replacement Report${titleSuffix}`,
    columns,
    excelData.map((r) => ({ ...r, cost: Number(r.cost).toLocaleString() })),
    { note },
  );
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
