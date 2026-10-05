import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const isDev = process.env.NODE_ENV === "development";
  const port = isDev ? 3e3 : Number(process.env.PORT) || 8080;
  const distPath = path.resolve(__dirname, "dist");
  const hasDist = fs.existsSync(distPath);
  const isProduction = !isDev && hasDist;
  app.use(express.json());
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (isProduction && hasDist) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[ICU-DATA] Server is running at http://0.0.0.0:${port} (${isProduction ? "production" : "development"})`);
  });
  const shutdown = () => {
    console.log("[ICU-DATA] Shutting down gracefully...");
    server.close(() => {
      console.log("[ICU-DATA] Closed out remaining connections.");
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
startServer().catch((err) => {
  console.error("[ICU-DATA] Fatal error starting server:", err);
  process.exit(1);
});
