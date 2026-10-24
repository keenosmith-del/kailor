import { copyFile, readFile, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "frontend/dist-public");
await stat(resolve(output, "404.html"));
for (const file of ["_headers", "_redirects"])
  await copyFile(
    resolve(root, "deploy/cloudflare", file),
    resolve(output, file),
  );

// Preview builds retain approved HTML metadata but must not be indexed as a
// duplicate production website. No preview-to-live-domain redirect is installed.
const preview =
  process.env.CF_PAGES === "1" && process.env.CF_PAGES_BRANCH !== "main";
const headersPath = resolve(output, "_headers");
let headers = await readFile(headersPath, "utf8");
if (preview) headers += "\n/*\n  X-Robots-Tag: noindex, nofollow\n";
await writeFile(headersPath, headers);

const redirects = await readFile(resolve(output, "_redirects"), "utf8");
for (const line of redirects
  .split("\n")
  .filter((line) => line && !line.startsWith("#"))) {
  const [from, to, status] = line.trim().split(/\s+/);
  assert.ok(from.startsWith("/") && to.startsWith("/") && from !== to);
  assert.ok(
    ["301", "302", "303", "307", "308"].includes(status),
    "Unsupported Pages redirect status",
  );
}
console.log(
  `Prepared static Cloudflare Pages routing and headers${preview ? " (noindex preview)" : ""}.`,
);
