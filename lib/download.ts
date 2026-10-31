import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
} from "docx";
import { saveAs } from "file-saver";

/* ------------------------------------------------------------------ *
 * Shared markdown parsing
 * The generator produces markdown: # headings, **bold**, - bullets,
 * 1. numbered lists, | pipe | tables |, and --- rules. We parse that
 * into a lightweight block model so each exporter can render it with
 * proper styling instead of dumping raw text.
 * ------------------------------------------------------------------ */

type InlineSpan = { text: string; bold: boolean };

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { kind: "paragraph"; spans: InlineSpan[] }
  | { kind: "bullet"; spans: InlineSpan[] }
  | { kind: "numbered"; index: number; spans: InlineSpan[] }
  | { kind: "rule" }
  | { kind: "table"; header: InlineSpan[][]; rows: InlineSpan[][][] };

const BRAND = { r: 99, g: 102, b: 241 }; // indigo-500, matches the app accent

function parseInline(raw: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  // Split on **bold** markers, keeping the delimiters out of the text.
  const parts = raw.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**")) {
      spans.push({ text: part.slice(2, -2), bold: true });
    } else {
      spans.push({ text: part, bold: false });
    }
  }
  return spans.length ? spans : [{ text: raw, bold: false }];
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:-]+\|[\s:|-]*$/.test(line) && line.includes("-");
}

function parseMarkdown(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let numberedCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      numberedCounter = 0;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      blocks.push({ kind: "rule" });
      continue;
    }

    // Table: a pipe row followed by a separator row
    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const header = splitTableRow(trimmed).map(parseInline);
      const rows: InlineSpan[][][] = [];
      i += 2; // skip header + separator
      while (i < lines.length && lines[i].trim().includes("|")) {
        rows.push(splitTableRow(lines[i]).map(parseInline));
        i++;
      }
      i--; // step back so the loop's i++ lands correctly
      blocks.push({ kind: "table", header, rows });
      numberedCounter = 0;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ kind: "heading", level, spans: parseInline(headingMatch[2]) });
      numberedCounter = 0;
      continue;
    }

    // A bold-only line acts as a subheading (the generator emits these a lot)
    if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) {
      blocks.push({ kind: "heading", level: 3, spans: parseInline(trimmed) });
      numberedCounter = 0;
      continue;
    }

    // Bullets
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({ kind: "bullet", spans: parseInline(bulletMatch[1]) });
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      numberedCounter += 1;
      blocks.push({
        kind: "numbered",
        index: numberedCounter,
        spans: parseInline(numberedMatch[2]),
      });
      continue;
    }

    numberedCounter = 0;
    blocks.push({ kind: "paragraph", spans: parseInline(trimmed) });
  }

  return blocks;
}

function spansToPlainText(spans: InlineSpan[]): string {
  return spans.map((s) => s.text).join("");
}

export function downloadAsTxt(content: string, filename: string) {
  // Strip markdown noise so the plain-text export reads cleanly too.
  const clean = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      if (isTableSeparator(line)) return null;
      return line.replace(/\*\*/g, "").replace(/^#{1,3}\s+/, "");
    })
    .filter((l) => l !== null)
    .join("\n");
  const blob = new Blob([clean], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${filename}.txt`);
}

/* ------------------------------------------------------------------ *
 * PDF export — modern typographic layout with real tables
 * ------------------------------------------------------------------ */

export function downloadAsPdf(content: string, filename: string) {
  const blocks = parseMarkdown(content);
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56; // ~0.78in
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const renderInline = (
    spans: InlineSpan[],
    x: number,
    maxWidth: number,
    fontSize: number,
    color: [number, number, number],
    lineHeight: number,
    font: "helvetica" = "helvetica"
  ) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    // Build a flat word list that carries its own bold flag.
    const words: { text: string; bold: boolean }[] = [];
    for (const span of spans) {
      const parts = span.text.split(/(\s+)/);
      for (const p of parts) {
        if (p === "") continue;
        words.push({ text: p, bold: span.bold });
      }
    }

    let cursorX = x;
    const startX = x;
    for (const word of words) {
      doc.setFont(font, word.bold ? "bold" : "normal");
      const w = doc.getTextWidth(word.text);
      if (cursorX + w > startX + maxWidth && cursorX > startX) {
        y += lineHeight;
        ensureSpace(lineHeight);
        cursorX = startX;
        if (/^\s+$/.test(word.text)) continue; // don't lead a line with a space
      }
      doc.text(word.text, cursorX, y);
      cursorX += w;
    }
    y += lineHeight;
  };

  for (const block of blocks) {
    switch (block.kind) {
      case "heading": {
        const sizes = { 1: 22, 2: 15, 3: 12 } as const;
        const gapBefore = { 1: 6, 2: 16, 3: 12 } as const;
        y += gapBefore[block.level];
        ensureSpace(sizes[block.level] + 8);
        const color: [number, number, number] =
          block.level === 1 ? [BRAND.r, BRAND.g, BRAND.b] : [17, 24, 39];
        doc.setFont("helvetica", "bold");
        renderInline(
          block.spans,
          margin,
          contentWidth,
          sizes[block.level],
          color,
          sizes[block.level] + 4
        );
        if (block.level === 1) {
          // Accent underline beneath the title
          y += 2;
          doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
          doc.setLineWidth(2);
          doc.line(margin, y, margin + 64, y);
          y += 10;
        } else {
          y += 2;
        }
        break;
      }
      case "paragraph": {
        ensureSpace(16);
        renderInline(block.spans, margin, contentWidth, 10.5, [31, 41, 55], 15);
        y += 4;
        break;
      }
      case "bullet": {
        ensureSpace(15);
        doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
        doc.circle(margin + 3, y - 3, 1.6, "F");
        renderInline(
          block.spans,
          margin + 14,
          contentWidth - 14,
          10.5,
          [31, 41, 55],
          15
        );
        y += 2;
        break;
      }
      case "numbered": {
        ensureSpace(15);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
        doc.text(`${block.index}.`, margin, y);
        renderInline(
          block.spans,
          margin + 18,
          contentWidth - 18,
          10.5,
          [31, 41, 55],
          15
        );
        y += 2;
        break;
      }
      case "rule": {
        y += 6;
        ensureSpace(10);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.line(margin, y, pageWidth - margin, y);
        y += 12;
        break;
      }
      case "table": {
        const colCount = block.header.length;
        const colWidth = contentWidth / colCount;
        const cellPadX = 8;
        const rowHeight = 22;

        const drawRow = (
          cells: InlineSpan[][],
          opts: { header?: boolean; zebra?: boolean }
        ) => {
          ensureSpace(rowHeight);
          const rowTop = y - 12;
          // Background
          if (opts.header) {
            doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
            doc.rect(margin, rowTop, contentWidth, rowHeight, "F");
          } else if (opts.zebra) {
            doc.setFillColor(245, 246, 250);
            doc.rect(margin, rowTop, contentWidth, rowHeight, "F");
          }
          // Text
          for (let c = 0; c < colCount; c++) {
            const cellSpans = cells[c] ?? [{ text: "", bold: false }];
            const anyBold = opts.header || cellSpans.some((s) => s.bold);
            doc.setFont("helvetica", anyBold ? "bold" : "normal");
            doc.setFontSize(9.5);
            if (opts.header) {
              doc.setTextColor(255, 255, 255);
            } else {
              doc.setTextColor(31, 41, 55);
            }
            const text = spansToPlainText(cellSpans);
            const align = c === 0 ? "left" : "right";
            const tx =
              align === "left"
                ? margin + c * colWidth + cellPadX
                : margin + (c + 1) * colWidth - cellPadX;
            doc.text(text, tx, y, { align: align as "left" | "right" });
          }
          y += rowHeight;
        };

        y += 6;
        drawRow(block.header, { header: true });
        block.rows.forEach((row, idx) => {
          drawRow(row, { zebra: idx % 2 === 1 });
        });
        // Outer border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        const tableTop = y - 12 - rowHeight * (block.rows.length + 1);
        doc.rect(margin, tableTop, contentWidth, rowHeight * (block.rows.length + 1));
        y += 10;
        break;
      }
    }
  }

  doc.save(`${filename}.pdf`);
}

/* ------------------------------------------------------------------ *
 * DOCX export — styled headings, bullets, and bordered tables
 * ------------------------------------------------------------------ */

const BRAND_HEX = "6366F1";
const INK_HEX = "1F2937";
const MUTED_HEX = "E2E8F0";
const ZEBRA_HEX = "F5F6FA";

function inlineToRuns(spans: InlineSpan[], opts?: { color?: string; size?: number }) {
  return spans.map(
    (s) =>
      new TextRun({
        text: s.text,
        bold: s.bold,
        size: opts?.size ?? 22,
        color: opts?.color ?? INK_HEX,
        font: "Calibri",
      })
  );
}

export async function downloadAsDocx(content: string, filename: string) {
  const blocks = parseMarkdown(content);
  const children: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    switch (block.kind) {
      case "heading": {
        if (block.level === 1) {
          children.push(
            new Paragraph({
              children: inlineToRuns(block.spans, { color: BRAND_HEX, size: 44 }),
              heading: HeadingLevel.TITLE,
              spacing: { after: 160 },
              border: {
                bottom: { color: BRAND_HEX, space: 6, style: BorderStyle.SINGLE, size: 12 },
              },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: inlineToRuns(block.spans, {
                color: INK_HEX,
                size: block.level === 2 ? 30 : 26,
              }),
              heading:
                block.level === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 100 },
            })
          );
        }
        break;
      }
      case "paragraph":
        children.push(
          new Paragraph({
            children: inlineToRuns(block.spans),
            spacing: { after: 140, line: 276 },
          })
        );
        break;
      case "bullet":
        children.push(
          new Paragraph({
            children: inlineToRuns(block.spans),
            bullet: { level: 0 },
            spacing: { after: 80, line: 276 },
          })
        );
        break;
      case "numbered":
        children.push(
          new Paragraph({
            children: inlineToRuns(block.spans),
            numbering: { reference: "clientcraft-numbered", level: 0 },
            spacing: { after: 80, line: 276 },
          })
        );
        break;
      case "rule":
        children.push(
          new Paragraph({
            text: "",
            border: {
              bottom: { color: MUTED_HEX, space: 1, style: BorderStyle.SINGLE, size: 6 },
            },
            spacing: { before: 120, after: 160 },
          })
        );
        break;
      case "table": {
        const colCount = block.header.length;
        const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
        const cellBorders = {
          top: noBorder,
          bottom: { style: BorderStyle.SINGLE, size: 2, color: MUTED_HEX },
          left: noBorder,
          right: noBorder,
        };

        const headerRow = new TableRow({
          tableHeader: true,
          children: block.header.map(
            (cell, c) =>
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: BRAND_HEX, color: "auto" },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: c === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                    children: inlineToRuns(
                      cell.map((s) => ({ ...s, bold: true })),
                      { color: "FFFFFF", size: 20 }
                    ),
                  }),
                ],
              })
          ),
        });

        const bodyRows = block.rows.map(
          (row, idx) =>
            new TableRow({
              children: Array.from({ length: colCount }).map((_, c) => {
                const cell = row[c] ?? [{ text: "", bold: false }];
                return new TableCell({
                  shading:
                    idx % 2 === 1
                      ? { type: ShadingType.CLEAR, fill: ZEBRA_HEX, color: "auto" }
                      : undefined,
                  borders: cellBorders,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: c === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                      children: inlineToRuns(cell, { size: 20 }),
                    }),
                  ],
                });
              }),
            })
        );

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...bodyRows],
          })
        );
        children.push(new Paragraph({ text: "", spacing: { after: 160 } }));
        break;
      }
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "clientcraft-numbered",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.START,
              style: { run: { color: BRAND_HEX, bold: true } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
