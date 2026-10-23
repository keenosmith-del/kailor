import { createServer } from "vite";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
process.env.NODE_ENV = "production";
const root = resolve(import.meta.dirname, "../frontend");
const routes = JSON.parse(
  await readFile(
    resolve(root, "src/components/public/PublicLayout/routes.json"),
    "utf8",
  ),
);
const server = await createServer({
  root,
  configFile: resolve(root, "vite.config.ts"),
  mode: "production",
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
await clean(resolve(root, "dist"));
const template = await readFile(resolve(root, "dist/index.html"), "utf8");
const css = (await readdir(resolve(root, "dist/assets")))
  .filter((file) =>
    /^(?:index|Home|PublicLayout|PageShell|Auth|ConversationModal|Contact|ContactForm|EnquiryComposer|HowItWorks|CommonQuestions|DiscoverySequence|SolutionDirection|ConsultancyProgress|ProcessClosing|BrandWordmark|ModalClose|Timeline|TimelineHero|MilestoneTimeline|ExperienceFoundation|EvolutionArchive|PresentAndBeyond|TimelineClosing)-.*\.css$/.test(
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
  const { render } = await server.ssrLoadModule("/src/prerender.tsx");
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
    const directory = resolve(root, "dist", path.slice(1));
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "index.html"), html);
  }
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
  await writeFile(resolve(root, "dist/spa.html"), fallback);
  console.log(
    `Prerendered ${Object.keys(routes).length} public/auth routes; private fallback is noindex.`,
  );
} finally {
  await server.close();
}
