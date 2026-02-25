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

// Curated Unsplash photo IDs — nature and cats
const unsplashPhotos = [
  // Nature
  { id: "photo-1469474968028-56623f02e42e", name: "mountain-sunset" },
  { id: "photo-1470071459604-3b5ec3a7fe05", name: "misty-forest" },
  { id: "photo-1441974231531-c6227db76b6e", name: "green-forest" },
  { id: "photo-1505118380757-91f5f5632de0", name: "ocean-sunset" },
  { id: "photo-1507525428034-b723cf961d3e", name: "tropical-beach" },
  { id: "photo-1472214103451-9374bd1c798e", name: "mountain-lake" },
  { id: "photo-1433086966358-54859d0ed716", name: "waterfall" },
  { id: "photo-1465189684280-6a8fa9b19a7a", name: "golden-field" },
  // Cats
  { id: "photo-1543852786-1cf6624b9987", name: "orange-cat" },
  { id: "photo-1573865526739-10659fec78a5", name: "tabby-cat" },
  { id: "photo-1495360010541-f48722b34f7d", name: "curious-cat" },
  { id: "photo-1526336024174-e58f5cdd8e13", name: "white-cat" },
  { id: "photo-1574158622682-e40e69881006", name: "kitten" },
  { id: "photo-1533738363-b7f9aef128ce", name: "black-cat" },
  { id: "photo-1592194996308-7b43878e84a6", name: "sleepy-cat" },
];

// In-memory cache for fetched Unsplash images
let unsplashCache: { buffer: Buffer; filename: string; mimeType: string }[] = [];
let cacheReady = false;
let cacheFetching = false;

async function fetchUnsplashImage(photo: typeof unsplashPhotos[0]): Promise<{ buffer: Buffer; filename: string; mimeType: string } | null> {
  const url = `https://images.unsplash.com/${photo.id}?w=800&h=600&fit=crop&q=80`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuf),
      filename: `${photo.name}.jpg`,
      mimeType: "image/jpeg",
    };
  } catch {
    return null;
  }
}

async function ensureUnsplashCache(): Promise<boolean> {
  if (cacheReady) return true;
  if (cacheFetching) {
    // Wait for in-flight fetch
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (cacheReady) return true;
    }
    return false;
  }
  cacheFetching = true;
  console.log("[demo] Fetching Unsplash images...");
  const results = await Promise.allSettled(
    unsplashPhotos.map((p) => fetchUnsplashImage(p)),
  );
  unsplashCache = results
    .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof fetchUnsplashImage>>>> =>
      r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
  if (unsplashCache.length > 0) {
    cacheReady = true;
    console.log(`[demo] Cached ${unsplashCache.length} Unsplash images (nature + cats)`);
  } else {
    console.warn("[demo] Failed to fetch any Unsplash images, will fall back to seed");
  }
  cacheFetching = false;
  return cacheReady;
}

// Fallback: local seed images
const bundledSeedDir = join(process.cwd(), "seed");
const sourceSeedDir = join(import.meta.dir, "../../seed");
const seedDir = existsSync(bundledSeedDir) ? bundledSeedDir : sourceSeedDir;
let seedImages: { buffer: Buffer; filename: string; mimeType: string }[] = [];

try {
  if (existsSync(seedDir)) {
    const files = readdirSync(seedDir).filter((f) =>
      /\.(jpg|jpeg|png|webp)$/i.test(f),
    );
    seedImages = files.map((filename) => ({
      buffer: readFileSync(join(seedDir, filename)),
      filename,
      mimeType: `image/${filename.split(".").pop() === "jpg" ? "jpeg" : filename.split(".").pop()}`,
    }));
    console.log(`[demo] Loaded ${seedImages.length} seed images (fallback)`);
  }
} catch {
  console.warn("[demo] No seed images found");
}

demoRoute.post("/demo-burst", async (c) => {
  // Try Unsplash first, fall back to seed images
  const hasUnsplash = await ensureUnsplashCache();
  const sampleImages = hasUnsplash ? unsplashCache : seedImages;

  if (sampleImages.length === 0) {
    return c.json({ error: "No sample images available" }, 503);
  }

  const body = await c.req.json().catch(() => ({}));
  const count = Math.min(
    Math.max(parseInt((body as any).count) || 5, 1),
    config.demoBurstMax,
  );

  // Shuffle for variety
  const shuffled = [...sampleImages].sort(() => Math.random() - 0.5);
  let triggered = 0;

  for (let i = 0; i < count; i++) {
    const sample = shuffled[i % shuffled.length];
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
