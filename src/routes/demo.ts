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

// Large pool of curated Unsplash photo IDs — nature and cats
const unsplashPool = [
  // Nature — landscapes
  { id: "photo-1469474968028-56623f02e42e", name: "mountain-sunset" },
  { id: "photo-1470071459604-3b5ec3a7fe05", name: "misty-forest" },
  { id: "photo-1441974231531-c6227db76b6e", name: "green-forest" },
  { id: "photo-1505118380757-91f5f5632de0", name: "ocean-waves" },
  { id: "photo-1507525428034-b723cf961d3e", name: "tropical-beach" },
  { id: "photo-1472214103451-9374bd1c798e", name: "mountain-lake" },
  { id: "photo-1433086966358-54859d0ed716", name: "waterfall" },
  { id: "photo-1465189684280-6a8fa9b19a7a", name: "golden-field" },
  { id: "photo-1501854140801-50d01698950b", name: "aerial-forest" },
  { id: "photo-1470252649378-9c29740c9fa8", name: "lavender-sunset" },
  { id: "photo-1418065460487-3e41a6c84dc5", name: "snowy-trees" },
  { id: "photo-1431794062232-2a99a5431c6c", name: "desert-dunes" },
  { id: "photo-1500534314083-4a96e2c08625", name: "tulip-field" },
  { id: "photo-1504567961542-e24d9439a724", name: "foggy-lake" },
  { id: "photo-1482938289607-e9573fc25ebb", name: "river-valley" },
  { id: "photo-1518495973542-4542c06a5843", name: "palm-sunset" },
  { id: "photo-1446329813274-7c9036bd9a1f", name: "starry-night" },
  { id: "photo-1509316975850-ff9c5deb0cd9", name: "autumn-road" },
  { id: "photo-1490750967868-88aa4f44baee", name: "cherry-blossom" },
  { id: "photo-1494500764479-0c8f2919a3d8", name: "redwood-forest" },
  { id: "photo-1439853949127-fa647821eba0", name: "coastal-cliff" },
  { id: "photo-1468276311594-df7cb65d8df6", name: "northern-lights" },
  { id: "photo-1506744038136-46273834b3fb", name: "morning-mist" },
  { id: "photo-1540206395-68808572332f", name: "mountain-dawn" },
  { id: "photo-1477346611705-65d1883cee1e", name: "green-valley" },
  // Cats
  { id: "photo-1543852786-1cf6624b9987", name: "orange-tabby" },
  { id: "photo-1573865526739-10659fec78a5", name: "tabby-cat" },
  { id: "photo-1495360010541-f48722b34f7d", name: "curious-cat" },
  { id: "photo-1526336024174-e58f5cdd8e13", name: "white-cat" },
  { id: "photo-1574158622682-e40e69881006", name: "kitten" },
  { id: "photo-1533738363-b7f9aef128ce", name: "black-cat" },
  { id: "photo-1592194996308-7b43878e84a6", name: "sleepy-cat" },
  { id: "photo-1561948955-570b270e7c36", name: "ginger-cat" },
  { id: "photo-1596854407944-bf87f6fdd49e", name: "fluffy-kitten" },
  { id: "photo-1571566882372-1598d88abd90", name: "siamese-cat" },
  { id: "photo-1548247416-ec66f4900b2e", name: "grey-cat" },
  { id: "photo-1478098711619-5ab0b478d6e6", name: "lazy-cat" },
  { id: "photo-1519052537078-e6302a4968d4", name: "cat-eyes" },
  { id: "photo-1511044568932-338cba0ad803", name: "playful-cat" },
  { id: "photo-1494256997604-768d1f608cac", name: "cat-window" },
  { id: "photo-1529778873920-4da4926a72c2", name: "tuxedo-cat" },
  { id: "photo-1518791841217-8f162f1e1131", name: "persian-cat" },
  { id: "photo-1513245543132-31f507417b26", name: "cat-garden" },
  { id: "photo-1415369629372-26f2fe60c467", name: "cat-stretch" },
  { id: "photo-1573865526739-10659fec78a5", name: "calico-cat" },
];

type UnsplashImage = { buffer: Buffer; filename: string; mimeType: string };

async function fetchUnsplashImage(photo: typeof unsplashPool[0]): Promise<UnsplashImage | null> {
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

// Fetch a random subset of `count` images from the pool each time
async function fetchRandomUnsplashImages(count: number): Promise<UnsplashImage[]> {
  const shuffled = [...unsplashPool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  console.log(`[demo] Fetching ${selected.length} random Unsplash images...`);
  const results = await Promise.allSettled(selected.map((p) => fetchUnsplashImage(p)));
  const images = results
    .filter((r): r is PromiseFulfilledResult<UnsplashImage> =>
      r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
  console.log(`[demo] Fetched ${images.length}/${selected.length} Unsplash images`);
  return images;
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
  const body = await c.req.json().catch(() => ({}));
  const count = Math.min(
    Math.max(parseInt((body as any).count) || 5, 1),
    config.demoBurstMax,
  );

  // Fetch fresh random Unsplash images for this burst, fall back to seed
  let sampleImages = await fetchRandomUnsplashImages(count);
  if (sampleImages.length === 0) {
    console.warn("[demo] Unsplash fetch failed, using seed images");
    sampleImages = [...seedImages].sort(() => Math.random() - 0.5).slice(0, count);
  }

  if (sampleImages.length === 0) {
    return c.json({ error: "No sample images available" }, 503);
  }

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
        await new Promise((r) => setTimeout(r, 100));
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
