import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export function downloadAsTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${filename}.txt`);
}

export function downloadAsPdf(content: string, filename: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  // Split content into lines that fit the page width
  const lines = doc.splitTextToSize(content, maxWidth);

  let y = margin;
  const lineHeight = 6;
  const pageHeight = doc.internal.pageSize.getHeight();

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(`${filename}.pdf`);
}

export async function downloadAsDocx(content: string, filename: string) {
  const paragraphs = content.split("\n").map((line) => {
    // Detect headings (lines that are all caps or start with **)
    const isBold =
      line.startsWith("**") ||
      line.toUpperCase() === line && line.trim().length > 0 && !/\d/.test(line);

    const cleanLine = line.replace(/\*\*/g, "");

    return new Paragraph({
      children: [
        new TextRun({
          text: cleanLine,
          bold: isBold,
          size: isBold ? 26 : 22,
          font: "Calibri",
        }),
      ],
      spacing: { after: 120 },
    });
  });

  const doc = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
