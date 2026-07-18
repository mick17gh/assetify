import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type ExportColumn = { header: string; key: string; width?: number };

export async function buildExcelReport(
  sheetName: string,
  columns: ExportColumn[],
  rows: Record<string, string | number>[],
  options?: { note?: string },
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  if (options?.note) {
    worksheet.addRow([options.note]);
    worksheet.addRow([]);
  }
  worksheet.columns = columns.map((col) => ({ header: col.header, key: col.key, width: col.width ?? 20 }));
  rows.forEach((row) => worksheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN_X = 36;
const MARGIN_TOP = 40;
const MARGIN_BOTTOM = 36;
const TITLE_SIZE = 16;
const META_SIZE = 9;
const CELL_SIZE = 9;
const HEADER_SIZE = 9;
const ROW_HEIGHT = 22;
const HEADER_HEIGHT = 24;

function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && font.widthOfTextAtSize(`${value}…`, size) > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}…`;
}

function drawTablePage({
  page,
  font,
  bold,
  title,
  pageLabel,
  columns,
  columnWidths,
  rows,
}: {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  title: string;
  pageLabel: string;
  columns: ExportColumn[];
  columnWidths: number[];
  rows: Record<string, string | number>[];
}) {
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const tableLeft = MARGIN_X;

  page.drawText(title, { x: tableLeft, y: PAGE_HEIGHT - MARGIN_TOP, size: TITLE_SIZE, font: bold, color: rgb(0.24, 0.12, 0.45) });
  page.drawText(pageLabel, {
    x: tableLeft,
    y: PAGE_HEIGHT - MARGIN_TOP - 18,
    size: META_SIZE,
    font,
    color: rgb(0.35, 0.3, 0.4),
  });

  let y = PAGE_HEIGHT - MARGIN_TOP - 40;

  // Header background
  page.drawRectangle({
    x: tableLeft,
    y: y - HEADER_HEIGHT,
    width: tableWidth,
    height: HEADER_HEIGHT,
    color: rgb(0.49, 0.23, 0.93),
  });

  let x = tableLeft;
  columns.forEach((column, index) => {
    const width = columnWidths[index] ?? 80;
    const label = truncateToWidth(column.header, bold, HEADER_SIZE, width - 10);
    page.drawText(label, {
      x: x + 5,
      y: y - 15,
      size: HEADER_SIZE,
      font: bold,
      color: rgb(1, 1, 1),
    });
    x += width;
  });

  // Header border
  page.drawRectangle({
    x: tableLeft,
    y: y - HEADER_HEIGHT,
    width: tableWidth,
    height: HEADER_HEIGHT,
    borderColor: rgb(0.42, 0.18, 0.82),
    borderWidth: 0.8,
  });

  y -= HEADER_HEIGHT;

  rows.forEach((row, rowIndex) => {
    const isAlt = rowIndex % 2 === 1;
    if (isAlt) {
      page.drawRectangle({
        x: tableLeft,
        y: y - ROW_HEIGHT,
        width: tableWidth,
        height: ROW_HEIGHT,
        color: rgb(0.97, 0.95, 1),
      });
    }

    let cellX = tableLeft;
    columns.forEach((column, index) => {
      const width = columnWidths[index] ?? 80;
      const raw = row[column.key];
      const text = truncateToWidth(raw == null ? "" : String(raw), font, CELL_SIZE, width - 10);
      page.drawText(text, {
        x: cellX + 5,
        y: y - 14,
        size: CELL_SIZE,
        font,
        color: rgb(0.2, 0.15, 0.3),
      });
      cellX += width;
    });

    page.drawRectangle({
      x: tableLeft,
      y: y - ROW_HEIGHT,
      width: tableWidth,
      height: ROW_HEIGHT,
      borderColor: rgb(0.85, 0.8, 0.92),
      borderWidth: 0.5,
    });

    y -= ROW_HEIGHT;
  });

  // Vertical column lines
  let lineX = tableLeft;
  columns.forEach((_, index) => {
    const width = columnWidths[index] ?? 80;
    if (index > 0) {
      page.drawLine({
        start: { x: lineX, y: y + rows.length * ROW_HEIGHT + HEADER_HEIGHT },
        end: { x: lineX, y: y },
        thickness: 0.5,
        color: rgb(0.85, 0.8, 0.92),
      });
    }
    lineX += width;
  });
}

function resolveColumnWidths(columns: ExportColumn[], usableWidth: number) {
  const weights = columns.map((column) => Math.max(column.width ?? 16, 8));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  return weights.map((weight) => (weight / totalWeight) * usableWidth);
}

export async function buildPdfReport(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, string | number>[],
  options?: { note?: string },
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const usableWidth = PAGE_WIDTH - MARGIN_X * 2;
  const columnWidths = resolveColumnWidths(columns, usableWidth);

  const headerBlock = 40 + HEADER_HEIGHT + (options?.note ? 14 : 0);
  const availableForRows = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - headerBlock;
  const maxRowsPerPage = Math.max(1, Math.floor(availableForRows / ROW_HEIGHT));

  const chunks: Record<string, string | number>[][] = [];
  for (let i = 0; i < rows.length; i += maxRowsPerPage) {
    chunks.push(rows.slice(i, i + maxRowsPerPage));
  }
  if (!chunks.length) chunks.push([]);

  const generatedAt = new Date().toLocaleString();
  chunks.forEach((chunk, index) => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const pageLabelParts = [`Generated: ${generatedAt}`];
    if (options?.note) pageLabelParts.push(options.note);
    if (chunks.length > 1) pageLabelParts.push(`Page ${index + 1} of ${chunks.length}`);
    drawTablePage({
      page,
      font,
      bold,
      title,
      pageLabel: pageLabelParts.join("  •  "),
      columns,
      columnWidths,
      rows: chunk,
    });

    if (!chunk.length) {
      page.drawText("No records found.", {
        x: MARGIN_X,
        y: PAGE_HEIGHT - MARGIN_TOP - 70,
        size: 11,
        font,
        color: rgb(0.4, 0.35, 0.45),
      });
    }
  });

  return Buffer.from(await pdf.save());
}

/** @deprecated Prefer buildPdfReport(title, columns, rows) */
export async function buildPdfReportFromLines(title: string, lines: string[], maxRowsPerPage = 28): Promise<Buffer> {
  return buildPdfReport(
    title,
    [{ header: "Details", key: "line", width: 100 }],
    lines.map((line) => ({ line })),
  );
}
