import ExcelJS from "exceljs";
import { humanizeKey } from "@/lib/reports/formatters";
import type { ReportDataPayload } from "@/lib/reports/types";

const META_KEYS = new Set([
  "reportId",
  "reportName",
  "period",
  "scopeName",
  "generatedAt",
  "primaryDataKey",
  "primarySheetName",
  "summary",
]);

function sanitizeCell(value: unknown): string | number {
  if (value == null) return "";
  if (typeof value === "number") return value;
  const text = String(value);
  if (/^[=+\-@]/.test(text)) return `'${text}`;
  return text;
}

function rowsFromPayload(payload: ReportDataPayload): Array<{ name: string; rows: Record<string, unknown>[] }> {
  const sheets: Array<{ name: string; rows: Record<string, unknown>[] }> = [];
  if (payload.summary && typeof payload.summary === "object") {
    sheets.push({
      name: "Summary",
      rows: Object.entries(payload.summary).map(([Metric, Value]) => ({ Metric, Value })),
    });
  }

  const primaryKey = payload.primaryDataKey;
  const primaryName = payload.primarySheetName ?? "Primary";
  if (primaryKey && Array.isArray(payload[primaryKey])) {
    const rows = payload[primaryKey] as Record<string, unknown>[];
    sheets.push({
      name: primaryName.slice(0, 31),
      rows: rows.length ? rows : [{ Note: "No rows for this period or filters." }],
    });
  }

  for (const [key, value] of Object.entries(payload)) {
    if (META_KEYS.has(key) || key === primaryKey) continue;
    if (!Array.isArray(value)) continue;
    const rows = value as Record<string, unknown>[];
    sheets.push({
      name: humanizeKey(key).slice(0, 31),
      rows: rows.length ? rows : [{ Note: "No rows for this period or filters." }],
    });
  }

  if (sheets.length === 0) {
    sheets.push({ name: "Report", rows: [{ Note: "No rows for this period or filters." }] });
  }
  return sheets;
}

export async function buildWorkbookFromPayload(payload: ReportDataPayload): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VortAsset";
  workbook.created = new Date();

  for (const sheet of rowsFromPayload(payload)) {
    const worksheet = workbook.addWorksheet(sheet.name);
    const columns = Object.keys(sheet.rows[0] ?? { Note: "" });
    worksheet.columns = columns.map((header) => ({ header, key: header, width: Math.min(Math.max(header.length + 4, 14), 36) }));
    for (const row of sheet.rows) {
      const mapped: Record<string, string | number> = {};
      for (const column of columns) mapped[column] = sanitizeCell(row[column]);
      worksheet.addRow(mapped);
    }
    worksheet.getRow(1).font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export function buildCsvFromPayload(payload: ReportDataPayload): string {
  const sheets = rowsFromPayload(payload);
  const primary = sheets.find((s) => s.name === (payload.primarySheetName ?? "").slice(0, 31)) ?? sheets[0]!;
  const columns = Object.keys(primary.rows[0] ?? { Note: "" });
  const lines = [
    columns.join(","),
    ...primary.rows.map((row) =>
      columns
        .map((column) => {
          const value = sanitizeCell(row[column]);
          const text = String(value);
          return text.includes(",") || text.includes('"') || text.includes("\n")
            ? `"${text.replace(/"/g, '""')}"`
            : text;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export function reportFilename(payload: ReportDataPayload, extension: "csv" | "xlsx"): string {
  const stamp = payload.generatedAt.toISOString().slice(0, 10);
  const name = payload.reportName.replace(/[^\w]+/g, "_");
  return `${name}_${stamp}.${extension}`;
}
