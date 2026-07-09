export const ASSET_IMPORT_HEADERS = [
  "ain",
  "serialNumber",
  "name",
  "purchaseDate",
  "purchaseCost",
  "categoryName",
  "branchCode",
] as const;

export function buildAssetImportTemplateCsv(): string {
  const headers = ASSET_IMPORT_HEADERS.join(",");
  const example = [
    "AIN-DEMO-0001",
    "SN-12345",
    "Sample Laptop",
    "2024-01-15",
    "2500.00",
    "Laptop",
    "HQ-ACCRA",
  ].join(",");
  return `${headers}\n${example}\n`;
}
