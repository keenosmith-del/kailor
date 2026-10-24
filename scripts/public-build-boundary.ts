import type { Plugin } from "vite";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";

// An explicit deploy boundary: reject private runtime imports, and copy only
// public assets referenced by the public entry's actual module graph.
export function publicBuildBoundary(): Plugin {
  const frontend = resolve(import.meta.dirname, "../frontend");
  const publicDir = resolve(frontend, "public");
  return {
    name: "kailor-public-only-boundary",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace("/src/main.tsx", "/src/main.public.tsx");
      },
    },
    async generateBundle(_options, bundle) {
      const assets = new Set([
        "robots.txt",
        "sitemap.xml",
        "social/kailor.png",
        "kailor-head.png",
      ]);
      const modules: string[] = [];
      for (const id of this.getModuleIds()) {
        if (id.startsWith(resolve(frontend, "../backend") + "/"))
          this.error("Backend code entered the public build");
        if (!id.startsWith(frontend + "/src/")) continue;
        const path = relative(frontend, id).split("?")[0];
        if (
          path !== "src/pages/Auth/Auth.css" &&
          !/^src\/(?:PublicWebsite\.tsx$|main\.public\.tsx$|pages\/Public\/|components\/(?:public\/|BrandWordmark\/|ModalClose\/)|styles\/|services\/(?:enquiries|useEnquiry|useEmailCopy)\.ts$)/.test(
            path,
          )
        )
          this.error(
            `Private application module entered the public build: ${path}`,
          );
        modules.push(path);
      }
      // Inspect rendered output rather than dead source branches, so gated
      // testimonial portraits and retired media never enter the public artifact.
      for (const output of Object.values(bundle)) {
        const source =
          output.type === "chunk"
            ? output.code
            : typeof output.source === "string"
              ? output.source
              : "";
        for (const match of source.matchAll(
          /["'`(](\/[\w./-]+\.(?:svg|png|jpe?g|webp|gif|woff2?|mp4|webm))["'`)]/g,
        ))
          assets.add(match[1].slice(1));
      }
      // The About portraits use a numeric template rather than literal URLs.
      for (let number = 11; number <= 16; number++)
        assets.add(`clients/${number}.jpeg`);
      const shipped: { path: string; bytes: number }[] = [];
      for (const path of [...assets].sort()) {
        const full = resolve(publicDir, path);
        if (!full.startsWith(publicDir + "/"))
          this.error("Public asset escaped its directory");
        const info = await stat(full);
        if (!info.isFile() || !extname(path))
          this.error(`Invalid public asset: ${path}`);
        this.emitFile({
          type: "asset",
          fileName: path,
          source: await readFile(full),
        });
        shipped.push({ path, bytes: info.size });
      }
      this.emitFile({
        type: "asset",
        fileName: "public-build-manifest.json",
        source: JSON.stringify(
          { publicOnly: true, modules: modules.sort(), assets: shipped },
          null,
          2,
        ),
      });
    },
  };
}
