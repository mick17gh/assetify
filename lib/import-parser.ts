import { createAssetSchema } from "@/lib/validation/asset";
import { importRowSchema } from "@/lib/validation/import";

export type ImportRowResult = {
  row: number;
  ok: boolean;
  errors: string[];
  data?: Record<string, string>;
};

export function parseCsv(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
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

    const mapped = {
      ain: record.ain ?? "",
      serialNumber: record.serialnumber ?? record.serial_number ?? "",
      name: record.name ?? "",
      purchaseDate: record.purchasedate ?? record.purchase_date ?? "",
      purchaseCost: record.purchasecost ?? record.purchase_cost ?? "",
      categoryName: record.categoryname ?? record.category_name ?? record.category ?? "",
      branchCode: record.branchcode ?? record.branch_code ?? record.branch ?? "",
    };

    const parsed = importRowSchema.safeParse(mapped);
    if (!parsed.success) {
      results.push({
        row: i + 1,
        ok: false,
        errors: parsed.error.issues.map((issue) => issue.message),
      });
      continue;
    }

    results.push({ row: i + 1, ok: true, errors: [], data: mapped });
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
  });
}
