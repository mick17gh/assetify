import { createAssetSchema } from "@/lib/validation/asset";
import { importRowSchema } from "@/lib/validation/import";

export type ImportMappedFields = {
  ain: string;
  serialNumber: string;
  name: string;
  purchaseDate: string;
  purchaseCost: string;
  warrantyExpiryDate: string;
  categoryName: string;
  branchCode: string;
  departmentName: string;
  roomName: string;
  shelfName: string;
  vendorName: string;
  custodianEmail: string;
  status: string;
  condition: string;
};

export type ImportRowResult = {
  row: number;
  ok: boolean;
  errors: string[];
  data: ImportMappedFields;
};

/** Normalize common spreadsheet date formats to YYYY-MM-DD for `<input type="date">`. */
export function normalizeImportDate(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const slash = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const year = slash[3];
    // Prefer day-month-year (common outside US); swap if first part can't be a day.
    const dayFirst = a > 12 || b <= 12;
    const day = dayFirst ? a : b;
    const month = dayFirst ? b : a;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed;
}

/** @deprecated use normalizeImportDate */
export const normalizePurchaseDate = normalizeImportDate;

export function normalizePurchaseCost(raw: string): string {
  return raw.trim().replace(/,/g, "").replace(/^[^\d]*/, "").replace(/[^\d.].*$/, "");
}

export function parseCsv(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

function pick(record: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value != null && value !== "") return value;
  }
  return "";
}

function mapRecord(record: Record<string, string>): ImportMappedFields {
  return {
    ain: pick(record, "ain").trim().toUpperCase(),
    serialNumber: pick(record, "serialnumber", "serial_number").trim(),
    name: pick(record, "name").trim(),
    purchaseDate: normalizeImportDate(pick(record, "purchasedate", "purchase_date")),
    purchaseCost: normalizePurchaseCost(pick(record, "purchasecost", "purchase_cost")),
    warrantyExpiryDate: normalizeImportDate(
      pick(record, "warrantyexpirydate", "warranty_expiry_date", "warrantyexpiry", "warranty"),
    ),
    categoryName: pick(record, "categoryname", "category_name", "category").trim(),
    branchCode: pick(record, "branchcode", "branch_code", "branch").trim(),
    departmentName: pick(record, "departmentname", "department_name", "department").trim(),
    roomName: pick(record, "roomname", "room_name", "room").trim(),
    shelfName: pick(record, "shelfname", "shelf_name", "shelf").trim(),
    vendorName: pick(record, "vendorname", "vendor_name", "vendor").trim(),
    custodianEmail: pick(
      record,
      "custodianemail",
      "custodian_email",
      "custodian",
      "email",
    ).trim(),
    status: pick(record, "status").trim(),
    condition: pick(record, "condition").trim(),
  };
}

export function validateImportRows(rows: string[][]): ImportRowResult[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const results: ImportRowResult[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });

    const mapped = mapRecord(record);
    const parsed = importRowSchema.safeParse(mapped);
    results.push({
      row: i + 1,
      ok: parsed.success,
      errors: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
      data: mapped,
    });
  }

  return results;
}

export function toCreateAssetInput(
  row: Record<string, string>,
  refs: { categoryId: string; branchId: string },
) {
  return createAssetSchema.parse({
    ain: row.ain,
    serialNumber: row.serialNumber,
    name: row.name,
    purchaseDate: row.purchaseDate,
    purchaseCost: row.purchaseCost,
    categoryId: refs.categoryId,
    branchId: refs.branchId,
    warrantyExpiryDate: row.warrantyExpiryDate || undefined,
  });
}
