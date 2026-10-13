import { writeFile } from "node:fs/promises";
import { createReport } from "../backend/src/assessment.js";
import { renderPdf } from "../backend/src/pdf.js";
import { personas, seededCases } from "../backend/src/library.js";
const report = createReport(personas[0].answers, 1, true, seededCases);
await writeFile(".cache/qa/synthetic-report.pdf", await renderPdf(report));
console.log(
  "Saved .cache/qa/synthetic-report.pdf for internal layout verification.",
);
