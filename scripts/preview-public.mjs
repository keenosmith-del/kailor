// Public-only local review: real static 404s, no application proxy or runtime.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve(import.meta.dirname, "../frontend/dist-public");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpeg": "image/jpeg",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".json": "application/json",
};
http
  .createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const aliases = {
        "/faqs": "/questions",
        "/timeline": "/",
        "/pricing": "/",
      };
      if (aliases[path.replace(/\/$/, "")]) {
        res.writeHead(301, { Location: aliases[path.replace(/\/$/, "")] });
        res.end();
        return;
      }
      let file = resolve(root, "." + path),
        status = 200;
      if (file !== root && !file.startsWith(root + "/")) {
        res.writeHead(400);
        res.end();
        return;
      }
      try {
        if ((await stat(file)).isDirectory())
          file = resolve(file, "index.html");
        await stat(file);
      } catch {
        file = resolve(root, "404.html");
        status = 404;
      }
      res.writeHead(status, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(500);
      res.end("Preview unavailable");
    }
  })
  .listen(5190, "127.0.0.1", () =>
    console.log("Public-only preview: http://127.0.0.1:5190"),
  );
