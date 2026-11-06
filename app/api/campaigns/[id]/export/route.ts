import { NextResponse } from "next/server";
import { PERMISSION_KEYS } from "@/constants";
import { writeAuditLog } from "@/lib/audit";
import { campaignExportRows } from "@/lib/campaign-service";
import { buildPdfReportFromLines } from "@/lib/export/report-export";
import { assertPermission } from "@/lib/permissions";
import { requireOrganizationId } from "@/lib/scoping";
import { getRequiredSession } from "@/lib/session";

export const runtime = "nodejs";

const COLUMNS = [
  { header: "Asset", key: "asset", width: 28 },
  { header: "Branch", key: "branch", width: 18 },
  { header: "Outcome", key: "outcome", width: 16 },
  { header: "Officer", key: "officer", width: 18 },
  { header: "Verified at", key: "verifiedAt", width: 24 },
  { header: "Notes", key: "notes", width: 28 },
];

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_READ);
  const organizationId = requireOrganizationId(session);
  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  const { report, rows } = await campaignExportRows(id, organizationId);
  const summary = [
    `Client: ${report.clientName}`,
    `Period: ${report.period}`,
    `Expected: ${report.expected}`,
    `Verified: ${report.verified}`,
    `Exceptions: ${report.exceptions}`,
    `Unregistered: ${report.unregistered}`,
    `Pending investigation: ${report.pendingInvestigation}`,
    "By branch:",
    ...report.byBranch.map((row) => `${row.branch}: expected ${row.expected}, verified ${row.verified}`),
    "By exception type:",
    ...report.byExceptionType.map((row) => `${row.type}: ${row.count}`),
  ];

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId,
    action: "campaign.export",
    entityType: "VerificationCampaign",
    entityId: id,
    metadata: { format, expected: report.expected, verified: report.verified, pendingInvestigation: report.pendingInvestigation },
  });

  if (format === "pdf") {
    const lines = [
      ...summary,
      "",
      COLUMNS.map((column) => column.header).join(" | "),
      ...rows.map((row) => COLUMNS.map((column) => String(row[column.key as keyof typeof row])).join(" | ")),
    ];
    const pdf = await buildPdfReportFromLines("Verification engagement report", lines);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="campaign-${id}.pdf"`,
      },
    });
  }

  const header = COLUMNS.map((column) => column.header).join(",");
  const body = rows
    .map((row) => COLUMNS.map((column) => csvCell(row[column.key as keyof typeof row])).join(","))
    .join("\n");
  const csv = `${summary.join("\n")}\n${header}\n${body}`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="campaign-${id}.csv"`,
    },
  });
}
