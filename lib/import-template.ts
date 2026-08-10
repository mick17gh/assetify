export const ASSET_IMPORT_HEADERS = [
  "ain",
  "serialNumber",
  "name",
  "purchaseDate",
  "purchaseCost",
  "warrantyExpiryDate",
  "categoryName",
  "branchCode",
  "departmentName",
  "roomName",
  "shelfName",
  "vendorName",
  "custodianEmail",
  "status",
  "condition",
] as const;

export function buildAssetImportTemplateCsv(): string {
  const headers = ASSET_IMPORT_HEADERS.join(",");
  const example = [
    "AIN-DEMO-0001",
    "SN-12345",
    "Sample Laptop",
    "2024-01-15",
    "2500.00",
    "2027-01-15",
    "Laptop",
    "HQ-ACCRA",
    "IT",
    "Server Room",
    "Shelf A",
    "Tech Vendor",
    "staff@example.com",
    "ACTIVE",
    "GOOD",
  ].join(",");
  return `${headers}\n${example}\n`;
}
