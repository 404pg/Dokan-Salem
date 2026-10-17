const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".dc.html": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch (error) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const filePathBase = pathname === "/admin" || pathname.startsWith("/admin/")
    ? path.join(root, "admin", "dist")
    : root;
  const filePathName = pathname === "/admin"
    ? "/index.html"
    : pathname.startsWith("/admin/")
      ? pathname.slice("/admin".length)
      : pathname;
  let filePath = path.resolve(filePathBase, `.${filePathName}`);
  if (filePath !== filePathBase && !filePath.startsWith(`${filePathBase}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) filePath = path.join(filePath, "index.html");
    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        const status = readError.code === "ENOENT" || readError.code === "ENOTDIR" ? 404 : 500;
        if (status === 500) console.error(`Unable to serve ${filePath}:`, readError);
        response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(status === 404 ? "Not found" : "Internal server error");
        return;
      }

      const extension = filePath.endsWith(".dc.html") ? ".dc.html" : path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        "Content-Type": contentTypes[extension] || "application/octet-stream",
        "Cache-Control": "no-cache"
      });
      response.end(request.method === "HEAD" ? undefined : content);
    });
  });
});

server.on("error", (error) => {
  console.error(`Unable to start the Dokan preview server on port ${port}:`, error);
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Dokan screen library is running at http://127.0.0.1:${port}`);
});
