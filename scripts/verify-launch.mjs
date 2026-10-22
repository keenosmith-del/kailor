import assert from "node:assert/strict";
import { readFile, stat, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
const root = resolve(import.meta.dirname, "../frontend/dist");
const routes = JSON.parse(
  await readFile(
    resolve(
      import.meta.dirname,
      "../frontend/src/components/public/PublicLayout/routes.json",
    ),
    "utf8",
  ),
);
let assets = 0;
for (const [path, page] of Object.entries(routes)) {
  const html = await readFile(
    resolve(root, path.slice(1), "index.html"),
    "utf8",
  );
  const document = new JSDOM(html, { url: "https://kailor.co.za" + path })
    .window.document;
  assert.equal(document.title, page.title);
  assert.equal(
    document.querySelector('meta[name="robots"]').content,
    page.index ? "index, follow" : "noindex, nofollow",
  );
  assert.equal(
    document.querySelector('link[rel="canonical"]').href,
    "https://kailor.co.za" + path,
  );
  assert.ok(document.querySelector("h1"), "Prerendered heading required");
  for (const element of document.querySelectorAll("[src], link[href]")) {
    const asset = element.getAttribute("src") || element.getAttribute("href");
    if (asset?.startsWith("/") && !asset.startsWith("//")) {
      await stat(resolve(root, "." + asset));
      assets++;
    }
  }
  if (path === "/") {
    assert.ok(!document.querySelector("#client-feedback, #work, #consultants"));
    const expectedLogos = (await readdir(resolve(root, "technology")))
      .filter((file) => file.endsWith(".svg"))
      .sort();
    const renderedLogos = Array.from(
      document.querySelectorAll(
        ".home-marquee__group:first-child .home-marquee__logo",
      ),
    )
      .map((image) => image.getAttribute("src").split("/").at(-1))
      .sort();
    assert.deepEqual(
      renderedLogos,
      expectedLogos,
      "Each local technology SVG must appear once in the marquee",
    );
    assert.ok(
      document.querySelector(".service-art__changing-word"),
      "Original cloud typography required",
    );
    assert.ok(
      !document.querySelector(
        ".service-art--cloud video, .service-art__video-poster",
      ),
      "Do not replace cloud typography with the MP4 or poster",
    );
    assert.ok(!html.includes("We thought we needed another platform"));
    for (const a of document.querySelectorAll('a[href^="/#"]'))
      assert.ok(
        document.getElementById(a.hash.slice(1)),
        `Missing section ${a.hash}`,
      );
  }
  for (const anchor of document.querySelectorAll('a[href^="/"]')) {
    const url = new URL(anchor.getAttribute("href"), "https://kailor.co.za");
    assert.ok(routes[url.pathname], `Unpublished destination ${url.pathname}`);
  }
}
const fallback = await readFile(resolve(root, "spa.html"), "utf8");
assert.ok(fallback.includes("noindex, nofollow"));
assert.ok(!fallback.includes('rel="canonical"'));
assert.equal(
  (await readFile(resolve(root, "sitemap.xml"), "utf8")).match(/<loc>/g).length,
  1,
);
for (const file of await readdir(resolve(root, "technology")))
  assert.ok(file.endsWith(".svg"), `Non-logo shipped: ${file}`);
// Catch common private credentials without printing potential values.
for (const file of (await readdir(resolve(root, "assets"))).filter((file) =>
  file.endsWith(".js"),
)) {
  const source = await readFile(resolve(root, "assets", file), "utf8");
  assert.ok(
    !/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{36}/.test(
      source,
    ),
    "Potential private credential in build",
  );
}
console.log(
  `Verified ${Object.keys(routes).length} prerendered routes, ${assets} asset references, production content gate, metadata, links and basic secret patterns.`,
);
