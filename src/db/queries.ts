import { db } from "./client";

export interface Upload {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  original_key: string;
  thumbnail_key: string | null;
  resized_key: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  exif_data: Record<string, string> | null;
  dominant_color: string | null;
  size_thumbnail: number | null;
  size_resized: number | null;
  processing_duration_ms: number | null;
  error_message: string | null;
  created_at: Date;
  processed_at: Date | null;
}

export async function createUpload(data: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  originalKey: string;
}): Promise<Upload> {
  const [row] = await db`
    INSERT INTO uploads (filename, mime_type, size_bytes, original_key)
    VALUES (${data.filename}, ${data.mimeType}, ${data.sizeBytes}, ${data.originalKey})
    RETURNING *
  `;
  return row as Upload;
}

export async function getUpload(id: string): Promise<Upload | null> {
  const [row] = await db`SELECT * FROM uploads WHERE id = ${id}`;
  return (row as Upload) || null;
}

export async function getGallery(limit: number, offset: number) {
  const items = await db`
    SELECT * FROM uploads
    WHERE status = 'processed'
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const [{ count }] = await db`
    SELECT COUNT(*)::int as count FROM uploads WHERE status = 'processed'
  `;
  return { items: items as unknown as Upload[], total: count };
}

export async function getStats() {
  const [stats] = await db`SELECT * FROM upload_stats`;
  return stats;
}

export async function updateUploadProcessing(id: string) {
  await db`
    UPDATE uploads
    SET status = 'processing', processing_started_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateUploadProcessed(id: string, data: {
  thumbnailKey: string;
  resizedKey: string;
  width: number;
  height: number;
  format: string;
  exifData: Record<string, string> | null;
  dominantColor: string;
  sizeThumbnail: number;
  sizeResized: number;
  processingDurationMs: number;
}) {
  await db`
    UPDATE uploads SET
      status = 'processed',
      thumbnail_key = ${data.thumbnailKey},
      resized_key = ${data.resizedKey},
      width = ${data.width},
      height = ${data.height},
      format = ${data.format},
      exif_data = ${JSON.stringify(data.exifData)},
      dominant_color = ${data.dominantColor},
      size_thumbnail = ${data.sizeThumbnail},
      size_resized = ${data.sizeResized},
      processing_duration_ms = ${data.processingDurationMs},
      processed_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateUploadError(id: string, error: string) {
  await db`
    UPDATE uploads SET status = 'error', error_message = ${error}
    WHERE id = ${id}
  `;
}
