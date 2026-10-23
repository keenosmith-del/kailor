// Public application contract. Documents remain in memory until explicit submission.
export const CAREER_INTERESTS = [
  "Software engineering",
  "AI & automation",
  "Cloud & infrastructure",
  "Technology consulting",
  "Product & design",
  "Something else",
] as const;
export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CAREER_LIMITS = {
  name: 150,
  email: 254,
  phone: 40,
  location: 150,
  link1: 500,
  link2: 500,
  message: 3000,
};
export type CareerFields = Record<keyof typeof CAREER_LIMITS, string>;
export type CareerErrors = Partial<
  Record<keyof CareerFields | "acknowledgement" | "cv", string>
>;
export const emptyCareerFields: CareerFields = {
  name: "",
  email: "",
  phone: "",
  location: "",
  link1: "",
  link2: "",
  message: "",
};
export function validateCareer(
  fields: CareerFields,
  acknowledged: boolean,
): CareerErrors {
  const errors: CareerErrors = {};
  if (!fields.name.trim()) errors.name = "Please enter your full name.";
  if (!fields.email.trim()) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    errors.email = "Enter a valid email address.";
  if (
    fields.phone.trim() &&
    (!/^[+\d() .-]+$/.test(fields.phone.trim()) ||
      fields.phone.replace(/\D/g, "").length < 5)
  )
    errors.phone = "Enter a valid phone number, or leave this blank.";
  for (const key of ["link1", "link2"] as const) {
    if (!fields[key].trim()) continue;
    try {
      const url = new URL(fields[key].trim());
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        !url.hostname.includes(".")
      )
        throw new Error();
    } catch {
      errors[key] = "Enter a full http:// or https:// professional link.";
    }
  }
  if (fields.message.trim().length < 10)
    errors.message =
      "Tell us a little more about yourself (at least 10 characters).";
  for (const key of Object.keys(CAREER_LIMITS) as (keyof CareerFields)[]) {
    if (
      fields[key].length > CAREER_LIMITS[key] ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(fields[key])
    )
      errors[key] = "Please shorten or check this field.";
  }
  if (!acknowledged)
    errors.acknowledgement =
      "Please acknowledge how your introduction will be handled.";
  return errors;
}
export function cvMetadataError(name: string, size: number) {
  if (!/\.(pdf|docx)$/i.test(name)) return "Choose a PDF or DOCX document.";
  if (!size) return "This file is empty. Choose another document.";
  if (size > CV_MAX_BYTES) return "Your CV must be 5 MB or smaller.";
  if (name.length > 240 || /[\x00-\x1f/\\]/.test(name))
    return "Please use a shorter, plain filename.";
  return "";
}
export function cvSignatureError(name: string, bytes: Uint8Array): string {
  const invalid =
    "This document's contents do not match a supported PDF or DOCX file.";
  if (cvMetadataError(name, bytes.length))
    return cvMetadataError(name, bytes.length);
  const text = new TextDecoder("latin1");
  if (/\.pdf$/i.test(name)) {
    return /^%PDF-1\.[0-7]|^%PDF-2\.0/.test(text.decode(bytes.slice(0, 10))) &&
      text.decode(bytes.slice(-1024)).includes("%%EOF")
      ? ""
      : invalid;
  }
  // Inspect the ZIP central directory, not the claimed MIME type or a PK prefix.
  // Full document parsing and malware scanning are required at the private processor.
  try {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = bytes.length - 22;
    while (
      end >= Math.max(0, bytes.length - 65557) &&
      view.getUint32(end, true) !== 0x06054b50
    )
      end--;
    if (end < 0 || view.getUint32(end, true) !== 0x06054b50) return invalid;
    if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true))
      return invalid;
    const count = view.getUint16(end + 10, true),
      size = view.getUint32(end + 12, true);
    let pos = view.getUint32(end + 16, true),
      expanded = 0;
    const start = pos,
      names = new Set<string>();
    if (
      !count ||
      count > 200 ||
      pos + size !== end ||
      end + 22 + view.getUint16(end + 20, true) !== bytes.length
    )
      return invalid;
    for (let n = 0; n < count; n++) {
      if (
        view.getUint32(pos, true) !== 0x02014b50 ||
        view.getUint16(pos + 8, true) & 1 ||
        ![0, 8].includes(view.getUint16(pos + 10, true))
      )
        return invalid;
      const length = view.getUint16(pos + 28, true),
        extra = view.getUint16(pos + 30, true),
        comment = view.getUint16(pos + 32, true);
      const entry = text.decode(bytes.slice(pos + 46, pos + 46 + length));
      if (
        entry.includes("..") ||
        entry.startsWith("/") ||
        entry.includes("\\") ||
        /vbaProject|\.exe$|\.bin$/i.test(entry) ||
        names.has(entry)
      )
        return invalid;
      expanded += view.getUint32(pos + 24, true);
      const local = view.getUint32(pos + 42, true);
      if (
        expanded > 20 * 1024 * 1024 ||
        local + 30 >= start ||
        view.getUint32(local, true) !== 0x04034b50
      )
        return invalid;
      const data =
        local +
        30 +
        view.getUint16(local + 26, true) +
        view.getUint16(local + 28, true);
      if (data + view.getUint32(pos + 20, true) > start) return invalid;
      names.add(entry);
      pos += 46 + length + extra + comment;
    }
    return pos === end &&
      names.has("[Content_Types].xml") &&
      names.has("_rels/.rels") &&
      names.has("word/document.xml")
      ? ""
      : invalid;
  } catch {
    return invalid;
  }
}
