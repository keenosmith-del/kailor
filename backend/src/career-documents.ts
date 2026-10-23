import { inflateRawSync } from "node:zlib";
import { cvSignatureError } from "../../shared/src/careers.js";
// Structural validation only: the private processor must still fully parse and scan.
export function careerDocumentError(name: string, buffer: Buffer): string {
  const issue = cvSignatureError(name, buffer);
  if (issue || /\.pdf$/i.test(name)) return issue;
  const invalid =
    "This DOCX document could not be validated. Please use a PDF or another DOCX.";
  try {
    let end = buffer.length - 22;
    while (buffer.readUInt32LE(end) !== 0x06054b50) end--;
    let pos = buffer.readUInt32LE(end + 16),
      total = 0;
    const required = new Map<string, string>();
    for (let i = 0; i < buffer.readUInt16LE(end + 10); i++) {
      const length = buffer.readUInt16LE(pos + 28),
        local = buffer.readUInt32LE(pos + 42);
      const entry = buffer.subarray(pos + 46, pos + 46 + length).toString();
      const method = buffer.readUInt16LE(pos + 10),
        compressed = buffer.readUInt32LE(pos + 20),
        size = buffer.readUInt32LE(pos + 24);
      if (
        buffer.readUInt16LE(local + 8) !== method ||
        buffer.readUInt16LE(local + 6) & 1
      )
        return invalid;
      const localLength = buffer.readUInt16LE(local + 26);
      if (
        buffer.subarray(local + 30, local + 30 + localLength).toString() !==
        entry
      )
        return invalid;
      const start = local + 30 + localLength + buffer.readUInt16LE(local + 28);
      const content =
        method === 0
          ? buffer.subarray(start, start + compressed)
          : inflateRawSync(buffer.subarray(start, start + compressed), {
              maxOutputLength: 20 * 1024 * 1024 - total,
            });
      total += content.length;
      if (content.length !== size || total > 20 * 1024 * 1024) return invalid;
      if (
        ["[Content_Types].xml", "_rels/.rels", "word/document.xml"].includes(
          entry,
        )
      ) {
        const xml = content.toString("utf8");
        if (/<!DOCTYPE|<!ENTITY/i.test(xml)) return invalid;
        required.set(entry, xml);
      }
      pos +=
        46 +
        length +
        buffer.readUInt16LE(pos + 30) +
        buffer.readUInt16LE(pos + 32);
    }
    return required
      .get("[Content_Types].xml")
      ?.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
      ) &&
      /<(?:\w+:)?document\b/.test(required.get("word/document.xml") || "") &&
      /<(?:\w+:)?Relationships\b/.test(required.get("_rels/.rels") || "")
      ? ""
      : invalid;
  } catch {
    return invalid;
  }
}
