import { Hono } from "hono";
import { getStats } from "../db/queries";

export const statsRoute = new Hono();

statsRoute.get("/stats", async (c) => {
  const stats = await getStats();
  return c.json({
    totalProcessed: stats?.total_processed || 0,
    avgProcessingMs: stats?.avg_processing_ms || 0,
    activeJobs: stats?.active_jobs || 0,
    last24hCount: stats?.last_24h_count || 0,
    storageUsedBytes: parseInt(stats?.storage_used_bytes || "0"),
  });
});
