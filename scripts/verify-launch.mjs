import assert from "node:assert/strict";
import { readFile, stat, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
const publicOnly = process.env.KAILOR_PUBLIC_ONLY_BUILD === "true";
const root = resolve(
  import.meta.dirname,
  publicOnly ? "../frontend/dist-public" : "../frontend/dist",
);
const routes = JSON.parse(
  await readFile(
    resolve(
      import.meta.dirname,
      "../frontend/src/components/public/PublicLayout/routes.json",
    ),
    "utf8",
  ),
);
assert.ok(
  !routes["/timeline"] && !routes["/pricing"],
  "Retired pages must stay outside the published route inventory",
);
for (const file of [
  "Timeline.tsx",
  "Timeline.css",
  "TimelineDetail.tsx",
  "TimelineReveal.tsx",
  "timelineData.ts",
  "TimelineHero/TimelineHero.tsx",
  "MilestoneTimeline/MilestoneTimeline.tsx",
  "ExperienceFoundation/ExperienceFoundation.tsx",
  "EvolutionArchive/EvolutionArchive.tsx",
  "PresentAndBeyond/PresentAndBeyond.tsx",
  "TimelineClosing/TimelineClosing.tsx",
])
  await stat(
    resolve(import.meta.dirname, "../frontend/src/pages/Public/Timeline", file),
  );
assert.ok(
  !(await readdir(resolve(root, "assets"))).some((file) =>
    /^(?:Timeline|TimelineHero|MilestoneTimeline|ExperienceFoundation|EvolutionArchive|PresentAndBeyond|TimelineClosing|Pricing|EngagementCards)-/.test(
      file,
    ),
  ),
  "Retired public pages must not enter production assets",
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
  assert.ok(
    !document.querySelector(
      'a[href="/timeline"], a[href="/timeline/"],a[href="/pricing"],a[href="/pricing/"]',
    ),
    "No active retired public-page links",
  );
  if (path === "/") {
    const gallery = document.getElementById("what-weve-built");
    assert.ok(gallery);
    assert.ok(gallery.previousElementSibling.querySelector("#collaboration"));
    assert.ok(
      gallery.nextElementSibling.classList.contains("home-perspective"),
    );
    assert.equal(gallery.querySelectorAll(".built-archive-card").length, 4);
    assert.equal(
      document.querySelector(".introduction-link").getAttribute("href"),
      "/#what-weve-built",
    );
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
    assert.ok(
      !document.querySelector(
        '.home-marquee__wreath,[src="/laurel-wreath.png"]',
      ),
    );
    assert.equal(
      document
        .querySelector(".service-art__changing-word strong")
        .textContent.trim(),
      "clarity",
    );
    assert.equal(
      document.querySelector("#introduction-title").textContent.trim(),
      "About",
    );
    assert.equal(
      document
        .querySelector(".introduction-avatar--additional")
        .textContent.trim(),
      "+32",
    );
    assert.deepEqual(
      Array.from(document.querySelectorAll(".introduction-stat-value")).map(
        (e) => e.getAttribute("aria-label"),
      ),
      ["6+", "18+", "30+"],
    );
    assert.deepEqual(
      Array.from(document.querySelectorAll(".perspective-value")).map((e) =>
        e.textContent.trim(),
      ),
      ["12+", "38%", "94%", "4.8/5"],
    );
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
const fallback = await readFile(
  resolve(root, publicOnly ? "404.html" : "spa.html"),
  "utf8",
);
assert.ok(fallback.includes("noindex, nofollow"));
assert.ok(!fallback.includes('rel="canonical"'));
if (publicOnly) {
  const manifest = JSON.parse(
    await readFile(resolve(root, "public-build-manifest.json"), "utf8"),
  );
  assert.equal(manifest.publicOnly, true);
  assert.ok(
    !manifest.modules.some((path) =>
      /^src\/(?:App\.tsx|pages\/(?:Auth|Application|Workspace|Discovery|Assessment|Solutions|Plans)\/|services\/api)/.test(
        path,
      ),
    ),
  );
  assert.ok(
    !manifest.assets.some(
      ({ path }) =>
        /\.(?:mp4|webm|md|txt)$/i.test(path) && path !== "robots.txt",
    ),
  );
  for (const file of (await readdir(resolve(root, "assets"))).filter((file) =>
    file.endsWith(".js"),
  )) {
    const source = await readFile(resolve(root, "assets", file), "utf8");
    assert.ok(
      !/fetch\(["']\/api\/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
        source,
      ),
      "Application API dependency in public runtime",
    );
  }
  assert.ok(!fallback.includes("We thought we needed another platform"));
}

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
