CREATE TABLE IF NOT EXISTS uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'processed', 'error')),
  original_key  TEXT NOT NULL,
  thumbnail_key TEXT,
  resized_key   TEXT,
  width         INTEGER,
  height        INTEGER,
  format        TEXT,
  exif_data     JSONB,
  dominant_color TEXT,
  size_thumbnail INTEGER,
  size_resized   INTEGER,
  processing_started_at  TIMESTAMPTZ,
  processing_duration_ms INTEGER,
  error_message          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_uploads_gallery
  ON uploads (created_at DESC)
  WHERE status = 'processed';

CREATE INDEX IF NOT EXISTS idx_uploads_active
  ON uploads (status)
  WHERE status IN ('pending', 'processing');

CREATE OR REPLACE VIEW upload_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'processed') AS total_processed,
  COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) AS active_jobs,
  ROUND(AVG(processing_duration_ms) FILTER (WHERE status = 'processed'))::INTEGER AS avg_processing_ms,
  COUNT(*) FILTER (WHERE status = 'processed' AND processed_at > NOW() - INTERVAL '24 hours') AS last_24h_count,
  COALESCE(SUM(size_bytes + COALESCE(size_thumbnail, 0) + COALESCE(size_resized, 0)) FILTER (WHERE status = 'processed'), 0) AS storage_used_bytes
FROM uploads;
