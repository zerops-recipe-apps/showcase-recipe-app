import { Hono } from "hono";
import { config } from "../config";
import { createUpload } from "../db/queries";
import { uploadToS3 } from "../storage/s3";
import { publishUploaded } from "../nats/publisher";
import { incrementActiveJobs, pushEvent } from "../cache/valkey";
import { wsManager } from "../ws/manager";
import type { WSMessage } from "../ws/protocol";

export const uploadRoute = new Hono();

uploadRoute.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body.image;

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No image file provided. Use field name 'image'." }, 400);
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: `Unsupported file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}` }, 400);
  }

  const maxBytes = config.upload.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return c.json({ error: `File too large. Max: ${config.upload.maxSizeMB}MB` }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomUUID();
  const originalKey = `originals/${id}/${file.name}`;

  await uploadToS3(originalKey, buffer, file.type);

  const upload = await createUpload({
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    originalKey,
  });

  await incrementActiveJobs();

  const sizeDisplay = file.size > 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)}MB`
    : `${(file.size / 1024).toFixed(0)}KB`;

  const wsMsg: WSMessage = {
    type: "upload_received",
    payload: {
      id: upload.id,
      filename: file.name,
      sizeBytes: file.size,
      timestamp: Date.now(),
      activeNodes: ["core", "l7", "app", "storage", "db", "nats"],
      activeEdges: ["core-app", "core-l7", "l7-app", "app-storage", "app-db", "app-nats"],
      edgeLabels: {
        "core-app": `POST /api/upload (${sizeDisplay})`,
        "core-l7": "HTTPS request",
        "l7-app": `POST /api/upload`,
        "app-storage": `PUT original`,
        "app-db": "INSERT upload record",
        "app-nats": "PUBLISH pipeline.uploaded",
      },
    },
  };
  wsManager.broadcast(wsMsg);
  await pushEvent({
    id: upload.id,
    type: "upload",
    timestamp: Date.now(),
    description: `Uploaded ${file.name}`,
    detail: sizeDisplay,
  });

  publishUploaded({
    id: upload.id,
    originalKey,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  return c.json({
    id: upload.id,
    filename: file.name,
    status: "pending",
  }, 201);
});
