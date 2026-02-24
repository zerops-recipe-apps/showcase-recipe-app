import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config } from "./config";
import { initDb } from "./db/client";
import { initNats } from "./nats/client";
import { subscribeToWorkerResults } from "./nats/subscriber";
import { wsManager } from "./ws/manager";
import { uploadRoute } from "./routes/upload";
import { galleryRoute } from "./routes/gallery";
import { statsRoute } from "./routes/stats";
import { demoRoute } from "./routes/demo";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

// REST routes
app.route("/api", uploadRoute);
app.route("/api", galleryRoute);
app.route("/api", statsRoute);
app.route("/api", demoRoute);

// Health check
app.get("/api/health", async (c) => {
  const checks: Record<string, string> = {};

  try {
    const { db } = await import("./db/client");
    await db`SELECT 1`;
    checks.postgres = "ok";
  } catch { checks.postgres = "error"; }

  try {
    const { valkey } = await import("./cache/valkey");
    await valkey.ping();
    checks.valkey = "ok";
  } catch { checks.valkey = "error"; }

  try {
    const { nc } = await import("./nats/client");
    checks.nats = nc.isClosed() ? "error" : "ok";
  } catch { checks.nats = "error"; }

  checks.storage = config.s3.accessKeyId ? "configured" : "missing";

  const allOk = Object.values(checks).every((v) => v === "ok" || v === "configured");

  return c.json({ status: allOk ? "ok" : "degraded", services: checks });
});

// Static file serving for frontend — works both in source mode and bundled mode
const bundledDistDir = join(process.cwd(), "frontend/dist");
const sourceDistDir = join(import.meta.dir, "../frontend/dist");
const distDir = existsSync(bundledDistDir) ? bundledDistDir : sourceDistDir;
const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

app.get("/*", async (c) => {
  const url = new URL(c.req.url);
  let filePath = join(distDir, url.pathname);

  if (!existsSync(filePath) || url.pathname === "/") {
    filePath = join(distDir, "index.html");
  }

  if (!existsSync(filePath)) {
    return c.text("Not Found", 404);
  }

  try {
    const content = readFileSync(filePath);
    const ext = filePath.substring(filePath.lastIndexOf("."));
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new Response(content, {
      headers: {
        "Content-Type": contentType,
        ...(ext !== ".html" ? { "Cache-Control": "public, max-age=31536000, immutable" } : {}),
      },
    });
  } catch {
    return c.text("Not Found", 404);
  }
});

// Initialize services and start
async function start() {
  console.log("[api] Initializing services...");

  await initDb();
  console.log("[api] PostgreSQL connected, schema ready");

  await initNats();
  console.log("[api] NATS connected");

  await subscribeToWorkerResults();
  console.log("[api] Subscribed to worker results");

  const server = Bun.serve({
    port: config.port,

    fetch(req, server) {
      const url = new URL(req.url);

      if (url.pathname === "/ws") {
        const upgraded = server.upgrade(req);
        if (upgraded) return undefined;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      return app.fetch(req);
    },

    websocket: {
      open(ws) {
        wsManager.add(ws);
      },
      message(ws, message) {
        if (message === "ping") {
          ws.send("pong");
        }
      },
      close(ws) {
        wsManager.remove(ws);
      },
    },
  });

  console.log(`[api] Server running on port ${config.port}`);
  console.log(`[api] WebSocket endpoint: ws://localhost:${config.port}/ws`);
}

start().catch((err) => {
  console.error("[api] Failed to start:", err);
  process.exit(1);
});
