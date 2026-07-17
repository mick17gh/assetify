import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts } from "pdf-lib";

export type ExportColumn = { header: string; key: string; width?: number };

export async function buildExcelReport(
  sheetName: string,
  columns: ExportColumn[],
  rows: Record<string, string | number>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns.map((col) => ({ header: col.header, key: col.key, width: col.width ?? 20 }));
  rows.forEach((row) => worksheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function buildPdfReport(
  title: string,
  lines: string[],
  maxRowsPerPage = 28,
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += maxRowsPerPage) {
    chunks.push(lines.slice(i, i + maxRowsPerPage));
  }
  if (!chunks.length) chunks.push([]);

  chunks.forEach((chunk, index) => {
    const page = pdf.addPage([842, 595]);
    page.drawText(title, { x: 40, y: 560, size: 18, font });
    page.drawText(`Generated: ${new Date().toLocaleString()}${chunks.length > 1 ? ` (page ${index + 1}/${chunks.length})` : ""}`, {
      x: 40,
      y: 540,
      size: 10,
      font,
    });
    let y = 515;
    for (const line of chunk) {
      page.drawText(line.slice(0, 115), { x: 40, y, size: 10, font });
      y -= 18;
    }
  });

  return Buffer.from(await pdf.save());
}
