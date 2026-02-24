import { Hono } from "hono";
import { getGallery, getUpload } from "../db/queries";
import { getPublicUrl } from "../storage/s3";

export const galleryRoute = new Hono();

galleryRoute.get("/gallery", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
  const offset = parseInt(c.req.query("offset") || "0");

  const { items, total } = await getGallery(limit, offset);

  const galleryItems = items.map((item) => ({
    id: item.id,
    filename: item.filename,
    status: item.status,
    thumbnailUrl: item.thumbnail_key ? getPublicUrl(item.thumbnail_key) : null,
    resizedUrl: item.resized_key ? getPublicUrl(item.resized_key) : null,
    originalUrl: getPublicUrl(item.original_key),
    metadata: item.width ? {
      width: item.width,
      height: item.height,
      format: item.format,
      exif: item.exif_data,
      dominantColor: item.dominant_color,
      sizeOriginal: item.size_bytes,
      sizeThumbnail: item.size_thumbnail,
      sizeResized: item.size_resized,
    } : null,
    processingDurationMs: item.processing_duration_ms,
    createdAt: item.created_at.toISOString(),
    processedAt: item.processed_at?.toISOString() || null,
  }));

  return c.json({ items: galleryItems, total });
});

galleryRoute.get("/gallery/:id", async (c) => {
  const id = c.req.param("id");
  const upload = await getUpload(id);

  if (!upload) {
    return c.json({ error: "Upload not found" }, 404);
  }

  return c.json({
    id: upload.id,
    filename: upload.filename,
    status: upload.status,
    thumbnailUrl: upload.thumbnail_key ? getPublicUrl(upload.thumbnail_key) : null,
    resizedUrl: upload.resized_key ? getPublicUrl(upload.resized_key) : null,
    originalUrl: getPublicUrl(upload.original_key),
    metadata: upload.width ? {
      width: upload.width,
      height: upload.height,
      format: upload.format,
      exif: upload.exif_data,
      dominantColor: upload.dominant_color,
      sizeOriginal: upload.size_bytes,
      sizeThumbnail: upload.size_thumbnail,
      sizeResized: upload.size_resized,
    } : null,
    processingDurationMs: upload.processing_duration_ms,
    createdAt: upload.created_at.toISOString(),
    processedAt: upload.processed_at?.toISOString() || null,
  });
});
