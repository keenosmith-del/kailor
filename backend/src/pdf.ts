import { customerReport } from "../../shared/src/report.js";
import PDFDocument from "pdfkit";
import type { Report } from "../../shared/src/index.js";
export async function renderPdf(report: Report): Promise<Buffer> {
  report = customerReport(report);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 55, bottom: 55, left: 55, right: 55 },
      bufferPages: true,
      info: { Title: "kailor — " + report.title, Author: "kailor" },
    });
    const buffers: Buffer[] = [];
    doc.on("data", (b) => buffers.push(b));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    doc.font("Helvetica-Bold").fontSize(28).fillColor("#252722").text("kailor");
    doc.moveDown(0.5).fontSize(19).text(report.title);
    doc.font("Helvetica").fontSize(10).fillColor("#666666").text(report.status);
    doc.text(
      `Prepared ${report.createdAt.slice(0, 10)}${report.synthetic ? " | SYNTHETIC ASSESSMENT — no commercial results" : ""}`,
    );
    doc.moveDown(2);
    for (const section of report.sections) {
      if (doc.y > 660) doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#252722")
        .text(section.title);
      doc.moveDown(0.5);
      for (const p of section.paragraphs) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#333333")
          .text(p, { lineGap: 3 });
        doc.moveDown(0.5);
      }
      doc.moveDown(0.8);
    }
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#777777")
        .text(
          `kailor | draft | ${report.synthetic ? "synthetic | " : ""}${i + 1} / ${pages.count}`,
          55,
          805,
          { lineBreak: false },
        );
    }
    doc.end();
  });
}
