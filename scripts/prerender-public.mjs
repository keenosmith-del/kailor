import { createServer } from "vite";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
process.env.NODE_ENV = "production";
const root = resolve(import.meta.dirname, "../frontend");
const publicOnly = process.env.KAILOR_PUBLIC_ONLY_BUILD === "true";
const output = publicOnly ? "dist-public" : "dist";
const routes = JSON.parse(
  await readFile(
    resolve(root, "src/components/public/PublicLayout/routes.json"),
    "utf8",
  ),
);
const server = await createServer({
  root,
  configFile: resolve(
    root,
    publicOnly ? "vite.public.config.ts" : "vite.config.ts",
  ),
  mode: publicOnly ? "public" : "production",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
async function clean(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await clean(path);
    else if (entry.name === ".DS_Store" || entry.name.endsWith(".md"))
      await rm(path);
  }
}
await clean(resolve(root, output));
const template = await readFile(resolve(root, output, "index.html"), "utf8");
const css = (await readdir(resolve(root, output, "assets")))
  .filter((file) =>
    /^(?:index|Home|PublicLayout|PageShell|Auth|ConversationModal|Contact|ContactForm|TryKailor|Simulation|Recommendation|SimulationClosing|Careers|ApplicationForm|CVAttachment|EnquiryComposer|HowItWorks|CommonQuestions|DiscoverySequence|SolutionDirection|ConsultancyProgress|ProcessClosing|BrandWordmark|ModalClose|WhatWeveBuilt|CapabilityDetail)-.*\.css$/.test(
      file,
    ),
  )
  .map((file) => `<link rel="stylesheet" href="/assets/${file}">`)
  .join("\n");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
try {
  const { render } = await server.ssrLoadModule(
    publicOnly ? "/src/prerender.public.tsx" : "/src/prerender.tsx",
  );
  for (const [path, page] of Object.entries(routes)) {
    const url = "https://kailor.co.za" + path;
    const image = "https://kailor.co.za/social/kailor.png";
    const tags = {
      description: page.description,
      robots: page.index ? "index, follow" : "noindex, nofollow",
      "og:type": "website",
      "og:site_name": "kailor",
      "og:title": page.title,
      "og:description": page.description,
      "og:url": url,
      "og:image": image,
      "og:image:width": "1200",
      "og:image:height": "630",
      "twitter:card": "summary_large_image",
      "twitter:title": page.title,
      "twitter:description": page.description,
      "twitter:image": image,
    };
    let html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
      .replace(
        /<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/g,
        "",
      )
      .replace(/<link rel="canonical"[^>]*>/g, "");
    const meta = Object.entries(tags)
      .map(
        ([key, value]) =>
          `<meta ${key.startsWith("og:") ? "property" : "name"}="${key}" content="${escape(value)}">`,
      )
      .join("\n");
    html = html.replace(
      "</head>",
      `${meta}\n${css}\n<link rel="canonical" href="${url}">\n</head>`,
    );
    const body = render(path);
    if (path === "/" && body.includes("client-notes-title"))
      throw new Error("Unverified testimonials escaped production gate");
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${body}</div>`,
    );
    const directory = resolve(root, output, path.slice(1));
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "index.html"), html);
  }
  if (publicOnly) {
    // A real 404, never a catch-all application shell or API proxy.
    const body = render("/page-unavailable");
    const fallback = template
      .replace(
        /<title>[^<]*<\/title>/,
        "<title>Page unavailable | kailor</title>",
      )
      .replace(
        /<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/g,
        "",
      )
      .replace(/<link rel="canonical"[^>]*>/g, "")
      .replace(
        "</head>",
        '<meta name="robots" content="noindex, nofollow">' + css + "</head>",
      )
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
    await writeFile(resolve(root, output, "404.html"), fallback);
  } else {
    // Unknown/private fallback must never inherit homepage metadata or indexing.
    const fallback = template
      .replace(/<title>[^<]*<\/title>/, "<title>Workspace | kailor</title>")
      .replace(
        /<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/g,
        "",
      )
      .replace(/<link rel="canonical"[^>]*>/g, "")
      .replace(
        "</head>",
        '<meta name="robots" content="noindex, nofollow"></head>',
      );
    await writeFile(resolve(root, output, "spa.html"), fallback);
  }
  console.log(
    publicOnly
      ? `Prerendered ${Object.keys(routes).length} public routes; unavailable routes use a noindex static 404.`
      : `Prerendered ${Object.keys(routes).length} public/auth routes; private fallback is noindex.`,
  );
} finally {
  await server.close();
}
