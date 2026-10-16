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
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#252722").text("kailor");
    doc.moveDown(0.5).fontSize(19).text(report.title);
    doc.font("Helvetica").fontSize(10).fillColor("#666666").text(report.status);
    doc.text(
      `Prepared ${report.createdAt.slice(0, 10)}${report.synthetic ? " | SYNTHETIC ASSESSMENT — no commercial results" : ""}`,
    );
    doc.moveDown(2);
    const brief = report.consulting;
    const print = (value: string) =>
      value.replace(/[\u2010-\u2015]/g, "-").replace(/…/g, "...");
    if (brief) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#333333")
        .text(print(brief.summary), { lineGap: 4 });
      doc
        .moveDown(1.5)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("Your starting point");
      doc.moveDown();
      for (let i = 0; i < brief.facts.length; i += 2) {
        const row = brief.facts.slice(i, i + 2),
          width = 230,
          gap = 25;
        doc.font("Helvetica").fontSize(10);
        const height =
          Math.max(
            ...row.map((f) =>
              doc.heightOfString(print(f.quote), { width, lineGap: 3 }),
            ),
          ) + 35;
        if (doc.y + height > 770) doc.addPage();
        const y = doc.y;
        row.forEach((f, j) => {
          const x = 55 + j * (width + gap);
          doc
            .font("Helvetica-Bold")
            .fontSize(9)
            .fillColor("#666666")
            .text(f.label, x, y, { width });
          doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#333333")
            .text(print(f.quote), x, y + 16, { width, lineGap: 3 });
        });
        doc.x = 55;
        doc.y = y + height;
      }
    }
    const consultingSections = brief
      ? [
          {
            title: "Conclusions and hypotheses",
            paragraphs: [...brief.conclusions, ...brief.hypotheses],
          },
          ...brief.directions.map((d) => ({
            title: d.title,
            paragraphs: [
              d.summary,
              `Status: ${d.status}`,
              `Why this may fit: ${d.why}`,
              `Supporting facts: ${d.basis
                .map((id) => brief.facts.find((f) => f.id === id)?.quote)
                .filter(Boolean)
                .join("; ")}`,
              `Requirements: ${d.requirements.join("; ")}`,
              `Risks: ${d.risks.join("; ")}`,
              `Commitment: ${d.commitment}`,
              `Time: ${d.timeDemand}`,
              `Cost to test: ${d.costToTest}`,
              `First step: ${d.firstStep}`,
              ...d.validation.map((v) => `${v.kind}: ${v.action}`),
              `Continue when: ${d.continueWhen}`,
              `Stop or change when: ${d.stopWhen}`,
            ],
          })),
          {
            title: "Remaining questions and next decision",
            paragraphs: [
              ...brief.unknowns,
              ...(report.assessmentType === "exploration"
                ? (report.sections.find((s) => s.title === "Your next decision")
                    ?.paragraphs ?? [])
                : []),
            ],
          },
          ...(brief.decisions.length
            ? [
                {
                  title: "Recorded decisions and preferences",
                  paragraphs: brief.decisions.map(
                    (d) => `${d.title} (${d.status}): ${d.notes}`,
                  ),
                },
              ]
            : []),
        ]
      : [];
    const written =
      brief && report.assessmentType === "exploration" ? [] : report.sections;
    for (const section of [...consultingSections, ...written]) {
      if (brief?.directions.some((d) => d.title === section.title))
        doc.addPage();
      if (doc.y > 660) doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#252722")
        .text(section.title);
      doc.moveDown(0.5);
      for (const raw of section.paragraphs) {
        const p = print(raw);
        const label = p.match(/^([^:]{2,27}): /);
        doc.font("Helvetica").fontSize(10);
        const height = doc.heightOfString(p, { width: 485, lineGap: 3 });
        if (doc.y + height > 775 && height < 650) doc.addPage();
        if (label)
          doc
            .font("Helvetica-Bold")
            .fillColor("#333333")
            .text(label[0], { continued: true });
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#333333")
          .text(label ? p.slice(label[0].length) : p, { lineGap: 3 });
        doc.moveDown(0.4);
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
