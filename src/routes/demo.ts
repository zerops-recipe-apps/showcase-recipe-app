import { Hono } from "hono";
import { config } from "../config";
import { createUpload } from "../db/queries";
import { uploadToS3 } from "../storage/s3";
import { publishUploaded } from "../nats/publisher";
import { incrementActiveJobs } from "../cache/valkey";
import { wsManager } from "../ws/manager";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

export const demoRoute = new Hono();

// Try bundled path first (dist/index.js → ../seed), then source path
const bundledSeedDir = join(process.cwd(), "seed");
const sourceSeedDir = join(import.meta.dir, "../../seed");
const seedDir = existsSync(bundledSeedDir) ? bundledSeedDir : sourceSeedDir;
let sampleImages: { buffer: Buffer; filename: string; mimeType: string }[] = [];

try {
  if (existsSync(seedDir)) {
    const files = readdirSync(seedDir).filter((f) =>
      /\.(jpg|jpeg|png|webp)$/i.test(f),
    );
    sampleImages = files.map((filename) => ({
      buffer: readFileSync(join(seedDir, filename)),
      filename,
      mimeType: `image/${filename.split(".").pop() === "jpg" ? "jpeg" : filename.split(".").pop()}`,
    }));
    console.log(`[demo] Loaded ${sampleImages.length} sample images`);
  }
} catch {
  console.warn("[demo] No seed images found — demo burst will be unavailable");
}

demoRoute.post("/demo-burst", async (c) => {
  if (sampleImages.length === 0) {
    return c.json({ error: "No sample images available" }, 503);
  }

  const body = await c.req.json().catch(() => ({}));
  const count = Math.min(
    Math.max(parseInt((body as any).count) || 5, 1),
    config.demoBurstMax,
  );

  let triggered = 0;

  for (let i = 0; i < count; i++) {
    const sample = sampleImages[i % sampleImages.length];
    const id = crypto.randomUUID();
    const originalKey = `originals/${id}/${sample.filename}`;

    try {
      await uploadToS3(originalKey, sample.buffer, sample.mimeType);

      const upload = await createUpload({
        filename: `demo-${sample.filename}`,
        mimeType: sample.mimeType,
        sizeBytes: sample.buffer.length,
        originalKey,
      });

      await incrementActiveJobs();

      publishUploaded({
        id: upload.id,
        originalKey,
        filename: `demo-${sample.filename}`,
        mimeType: sample.mimeType,
        sizeBytes: sample.buffer.length,
      });

      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }

      triggered++;
    } catch (err) {
      console.error(`[demo] Failed to trigger sample ${i}:`, err);
    }
  }

  wsManager.broadcast({
    type: "upload_received",
    payload: {
      id: "burst",
      filename: `Demo burst (${triggered} images)`,
      sizeBytes: 0,
      timestamp: Date.now(),
      activeNodes: ["app", "api"],
      activeEdges: ["app-api"],
      edgeLabels: { "app-api": `BURST ${triggered} images` },
    },
  });

  return c.json({ triggered });
});
