// Local build review only. Production uses the documented HTTPS reverse proxy.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve(import.meta.dirname, "../frontend/dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
http
  .createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (path.startsWith("/api/")) {
        const upstream = http.request(
          new URL(
            path,
            process.env.KAILOR_API_ORIGIN || "http://127.0.0.1:5050",
          ),
          { method: req.method, headers: req.headers },
          (response) => {
            res.writeHead(response.statusCode, response.headers);
            response.pipe(res);
          },
        );
        upstream.on("error", () => {
          res.writeHead(503);
          res.end("API unavailable");
        });
        req.pipe(upstream);
        return;
      }
      let file = resolve(root, "." + path);
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
        if (extname(path)) {
          res.writeHead(404);
          res.end();
          return;
        }
        file = resolve(root, "spa.html");
      }
      const data = await readFile(file);
      res.setHeader(
        "Content-Type",
        mime[extname(file)] || "application/octet-stream",
      );
      res.setHeader(
        "X-Robots-Tag",
        path === "/" ? "index, follow" : "noindex, nofollow",
      );
      const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      if (range) {
        const start = Number(range[1]),
          end = Math.min(
            range[2] ? Number(range[2]) : data.length - 1,
            data.length - 1,
          );
        if (start > end) {
          res.writeHead(416);
          res.end();
          return;
        }
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${data.length}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
        });
        res.end(data.subarray(start, end + 1));
        return;
      }
      res.setHeader("Content-Length", data.length);
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(500);
      res.end("Preview unavailable");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Launch build review: http://127.0.0.1:4173"),
  );
