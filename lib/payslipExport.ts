import * as XLSX from "xlsx";
import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

export interface PayslipExportRecord {
  employee: string;
  role: string;
  site: string;
  period: string;
  daysWorked: number;
  totalHours: number;
  ratePerDay: number;
  totalPay: number;
}

function buildExportFilename(prefix: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${prefix}-${yyyy}-${mm}-${dd}.xlsx`;
}

function buildPdfFilename(prefix: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${prefix}-${yyyy}-${mm}-${dd}.pdf`;
}

function sanitizeSheetName(name: string): string {
  const normalized = name.replace(/[\\/*?:[\]]/g, " ").replace(/\s+/g, " ").trim();
  const fallback = normalized || "Employee";
  return fallback.slice(0, 31);
}

function sanitizeFilenamePart(name: string): string {
  const normalized = name.replace(/[^a-z0-9]+/gi, "-").replace(/-+/g, "-");
  const trimmed = normalized.replace(/^-|-$/g, "").toLowerCase();
  return trimmed || "employee";
}

function toPeso(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function downloadBytes(
  bytes: Uint8Array,
  filename: string,
  mimeType: string,
): void {
  if (typeof window === "undefined") return;

  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function splitLongWordByWidth(
  word: string,
  maxWidth: number,
  font: PDFFont,
  size: number,
): string[] {
  if (word.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < word.length) {
    let end = start + 1;

    while (
      end <= word.length &&
      font.widthOfTextAtSize(word.slice(start, end), size) <= maxWidth
    ) {
      end += 1;
    }

    const safeEnd = Math.max(start + 1, end - 1);
    chunks.push(word.slice(start, safeEnd));
    start = safeEnd;
  }

  return chunks;
}

function wrapTextToWidth(
  text: string,
  maxWidth: number,
  font: PDFFont,
  size: number,
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return ["-"];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      currentLine = word;
      continue;
    }

    const chunks = splitLongWordByWidth(word, maxWidth, font, size);
    if (chunks.length === 0) continue;
    lines.push(...chunks.slice(0, -1));
    currentLine = chunks[chunks.length - 1] ?? "";
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : ["-"];
}

function drawTextRightAligned(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
): void {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: rightX - textWidth,
    y,
    size,
    font,
    color,
  });
}

async function createPayslipPdf(records: PayslipExportRecord[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const generatedAt = new Date().toLocaleString("en-PH");

  records.forEach((record, index) => {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const margin = 36;
    const contentWidth = width - margin * 2;

    const palette = {
      brand: rgb(0.1, 0.37, 0.23),
      brandLight: rgb(0.9, 0.95, 0.92),
      ink: rgb(0.1, 0.1, 0.1),
      muted: rgb(0.45, 0.48, 0.5),
      border: rgb(0.85, 0.88, 0.9),
      white: rgb(1, 1, 1),
      background: rgb(0.98, 0.99, 0.98),
    };

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: palette.background,
    });

    const headerHeight = 112;
    const headerBottom = height - headerHeight;

    page.drawRectangle({
      x: 0,
      y: headerBottom,
      width,
      height: headerHeight,
      color: palette.brand,
    });

    page.drawText("PRODISENYO", {
      x: margin,
      y: height - 42,
      size: 22,
      font: fontBold,
      color: palette.white,
    });
    page.drawText("Employee Payslip", {
      x: margin,
      y: height - 66,
      size: 12,
      font: fontRegular,
      color: palette.white,
    });

    const payslipNo = `PS-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${String(index + 1).padStart(3, "0")}`;

    drawTextRightAligned(
      page,
      `Payslip No: ${payslipNo}`,
      width - margin,
      height - 44,
      10,
      fontBold,
      palette.white,
    );
    drawTextRightAligned(
      page,
      `Issued: ${new Date().toLocaleDateString("en-PH")}`,
      width - margin,
      height - 62,
      10,
      fontRegular,
      palette.white,
    );

    let currentTop = headerBottom - 18;

    const employeeFields: Array<{ label: string; value: string }> = [
      { label: "Employee", value: record.employee },
      { label: "Role", value: record.role },
      { label: "Site", value: record.site },
      { label: "Payroll Period", value: record.period },
      { label: "Days Worked", value: `${record.daysWorked} day(s)` },
      { label: "Total Hours", value: `${record.totalHours.toFixed(2)} hrs` },
    ];

    const labelColumnWidth = 110;
    const rowValueWidth = contentWidth - labelColumnWidth - 40;
    const rowHeights = employeeFields.map((field) => {
      const wrapped = wrapTextToWidth(
        field.value,
        rowValueWidth,
        fontRegular,
        10.5,
      );
      return Math.max(24, wrapped.length * 14 + 10);
    });

    const employeeCardHeight = 38 + rowHeights.reduce((sum, value) => sum + value, 0);
    const employeeCardBottom = currentTop - employeeCardHeight;

    page.drawRectangle({
      x: margin,
      y: employeeCardBottom,
      width: contentWidth,
      height: employeeCardHeight,
      color: palette.white,
      borderColor: palette.border,
      borderWidth: 1,
    });
    page.drawRectangle({
      x: margin,
      y: currentTop - 30,
      width: contentWidth,
      height: 30,
      color: palette.brandLight,
    });
    page.drawText("Employee Information", {
      x: margin + 12,
      y: currentTop - 20,
      size: 11,
      font: fontBold,
      color: palette.brand,
    });

    let rowTop = currentTop - 38;
    employeeFields.forEach((field, fieldIndex) => {
      const rowHeight = rowHeights[fieldIndex] ?? 24;
      const rowBottom = rowTop - rowHeight;

      if (fieldIndex > 0) {
        page.drawLine({
          start: { x: margin + 10, y: rowTop },
          end: { x: margin + contentWidth - 10, y: rowTop },
          thickness: 0.5,
          color: palette.border,
        });
      }

      page.drawText(field.label, {
        x: margin + 12,
        y: rowTop - 15,
        size: 10,
        font: fontBold,
        color: palette.muted,
      });

      const wrappedValue = wrapTextToWidth(
        field.value,
        rowValueWidth,
        fontRegular,
        10.5,
      );
      wrappedValue.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: margin + labelColumnWidth + 22,
          y: rowTop - 15 - lineIndex * 14,
          size: 10.5,
          font: fontRegular,
          color: palette.ink,
        });
      });

      rowTop = rowBottom;
    });

    currentTop = employeeCardBottom - 18;

    const basePay = record.daysWorked * record.ratePerDay;
    const adjustments = record.totalPay - basePay;
    const earningsRows: Array<{ label: string; value: string; bold?: boolean }> = [
      { label: "Base Pay", value: toPeso(basePay) },
      { label: "Payroll Adjustments", value: toPeso(adjustments) },
      { label: "Net Pay", value: toPeso(record.totalPay), bold: true },
    ];

    const earningsCardHeight = 154;
    const earningsCardBottom = currentTop - earningsCardHeight;

    page.drawRectangle({
      x: margin,
      y: earningsCardBottom,
      width: contentWidth,
      height: earningsCardHeight,
      color: palette.white,
      borderColor: palette.border,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: margin,
      y: currentTop - 30,
      width: contentWidth,
      height: 30,
      color: palette.brandLight,
    });

    page.drawText("Earnings Summary", {
      x: margin + 12,
      y: currentTop - 20,
      size: 11,
      font: fontBold,
      color: palette.brand,
    });

    let earningsY = currentTop - 48;
    earningsRows.forEach((row, rowIndex) => {
      const rowHeight = 30;
      const rowBottom = earningsY - rowHeight;

      if (row.bold) {
        page.drawRectangle({
          x: margin + 10,
          y: rowBottom + 2,
          width: contentWidth - 20,
          height: rowHeight - 4,
          color: rgb(0.92, 0.97, 0.93),
        });
      }

      page.drawText(row.label, {
        x: margin + 16,
        y: earningsY - 18,
        size: 10.5,
        font: row.bold ? fontBold : fontRegular,
        color: palette.ink,
      });

      drawTextRightAligned(
        page,
        row.value,
        margin + contentWidth - 16,
        earningsY - 18,
        10.5,
        row.bold ? fontBold : fontRegular,
        row.bold ? palette.brand : palette.ink,
      );

      if (rowIndex < earningsRows.length - 1) {
        page.drawLine({
          start: { x: margin + 10, y: rowBottom },
          end: { x: margin + contentWidth - 10, y: rowBottom },
          thickness: 0.5,
          color: palette.border,
        });
      }

      earningsY = rowBottom;
    });

    currentTop = earningsCardBottom - 18;

    const noteText =
      "This payslip is system-generated and valid without a physical signature. Please verify details with Payroll Administration for any concerns.";
    const noteLines = wrapTextToWidth(noteText, contentWidth - 24, fontRegular, 9.5);
    const noteHeight = 28 + noteLines.length * 12;
    const noteBottom = currentTop - noteHeight;

    page.drawRectangle({
      x: margin,
      y: noteBottom,
      width: contentWidth,
      height: noteHeight,
      color: rgb(0.985, 0.985, 0.985),
      borderColor: palette.border,
      borderWidth: 1,
    });
    page.drawText("Notes", {
      x: margin + 12,
      y: currentTop - 16,
      size: 10,
      font: fontBold,
      color: palette.muted,
    });
    noteLines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: margin + 12,
        y: currentTop - 32 - lineIndex * 12,
        size: 9.5,
        font: fontRegular,
        color: palette.muted,
      });
    });

    const signatureY = 92;
    const signatureWidth = 170;
    const leftSignatureX = margin + 24;
    const rightSignatureX = width - margin - 24 - signatureWidth;

    page.drawLine({
      start: { x: leftSignatureX, y: signatureY },
      end: { x: leftSignatureX + signatureWidth, y: signatureY },
      thickness: 0.8,
      color: palette.muted,
    });
    page.drawLine({
      start: { x: rightSignatureX, y: signatureY },
      end: { x: rightSignatureX + signatureWidth, y: signatureY },
      thickness: 0.8,
      color: palette.muted,
    });
    page.drawText("Employee Signature", {
      x: leftSignatureX + 32,
      y: signatureY - 14,
      size: 9,
      font: fontRegular,
      color: palette.muted,
    });
    page.drawText("Authorized Signature", {
      x: rightSignatureX + 30,
      y: signatureY - 14,
      size: 9,
      font: fontRegular,
      color: palette.muted,
    });

    page.drawLine({
      start: { x: margin, y: 52 },
      end: { x: width - margin, y: 52 },
      thickness: 0.8,
      color: palette.border,
    });
    page.drawText(`Generated: ${generatedAt}`, {
      x: margin,
      y: 38,
      size: 8.8,
      font: fontRegular,
      color: palette.muted,
    });
    drawTextRightAligned(
      page,
      `Page ${index + 1} of ${records.length}`,
      width - margin,
      38,
      8.8,
      fontRegular,
      palette.muted,
    );
  });

  return pdfDoc.save();
}

function buildEmployeeSheet(record: PayslipExportRecord): XLSX.WorkSheet {
  const rows = [
    ["Field", "Value"],
    ["Employee", record.employee],
    ["Role", record.role],
    ["Site", record.site],
    ["Payroll Period", record.period],
    ["Days Worked", record.daysWorked],
    ["Total Hours", Number(record.totalHours.toFixed(2))],
    ["Rate/Day", toPeso(record.ratePerDay)],
    ["Total Pay", toPeso(record.totalPay)],
  ];

  return XLSX.utils.aoa_to_sheet(rows);
}

function makeUniqueSheetName(
  baseName: string,
  usedNames: Set<string>,
): string {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  let index = 2;
  while (index <= 999) {
    const suffix = ` (${index})`;
    const truncated = baseName.slice(0, Math.max(0, 31 - suffix.length));
    const candidate = `${truncated}${suffix}`;

    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }

    index += 1;
  }

  const fallback = `${Date.now()}`.slice(-6);
  const candidate = `Employee ${fallback}`.slice(0, 31);
  usedNames.add(candidate);
  return candidate;
}

export function exportEmployeePayslipToExcel(
  record: PayslipExportRecord,
  filename?: string,
): void {
  const workbook = XLSX.utils.book_new();
  const worksheet = buildEmployeeSheet(record);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payslip");

  const defaultFilename = buildExportFilename(
    `payslip-${sanitizeFilenamePart(record.employee)}`,
  );
  XLSX.writeFile(workbook, filename || defaultFilename);
}

export function exportAllPayslipsToExcel(
  records: PayslipExportRecord[],
  filename?: string,
): void {
  if (records.length === 0) return;

  const workbook = XLSX.utils.book_new();

  const summaryRows = records.map((record) => ({
    Employee: record.employee,
    Role: record.role,
    Site: record.site,
    "Payroll Period": record.period,
    "Days Worked": record.daysWorked,
    "Total Hours": Number(record.totalHours.toFixed(2)),
    "Rate/Day": record.ratePerDay,
    "Total Pay": Number(record.totalPay.toFixed(2)),
  }));

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Payslips");

  const usedSheetNames = new Set<string>(["Payslips"]);
  for (const record of records) {
    const baseSheetName = sanitizeSheetName(record.employee);
    const sheetName = makeUniqueSheetName(baseSheetName, usedSheetNames);
    const worksheet = buildEmployeeSheet(record);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  XLSX.writeFile(workbook, filename || buildExportFilename("payslips-overall"));
}

export async function exportEmployeePayslipToPdf(
  record: PayslipExportRecord,
  filename?: string,
): Promise<void> {
  const bytes = await createPayslipPdf([record]);
  const defaultFilename = buildPdfFilename(
    `payslip-${sanitizeFilenamePart(record.employee)}`,
  );
  downloadBytes(bytes, filename || defaultFilename, "application/pdf");
}

export async function exportAllPayslipsToPdf(
  records: PayslipExportRecord[],
  filename?: string,
): Promise<void> {
  if (records.length === 0) return;

  const bytes = await createPayslipPdf(records);
  downloadBytes(
    bytes,
    filename || buildPdfFilename("payslips-overall"),
    "application/pdf",
  );
}
