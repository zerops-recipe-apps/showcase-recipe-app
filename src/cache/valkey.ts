import Redis from "ioredis";
import { config } from "../config";

export const valkey = new Redis({
  host: config.valkey.host,
  port: config.valkey.port,
  password: config.valkey.password,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 5000);
  },
});

export async function cacheProcessedUpload(id: string, data: unknown) {
  await valkey.setex(`upload:${id}`, 3600, JSON.stringify(data));
}

export async function getCachedUpload(id: string): Promise<unknown | null> {
  const cached = await valkey.get(`upload:${id}`);
  return cached ? JSON.parse(cached) : null;
}

export async function incrementActiveJobs() {
  await valkey.incr("stats:active_jobs");
}

export async function decrementActiveJobs() {
  await valkey.decr("stats:active_jobs");
}

export async function getActiveJobs(): Promise<number> {
  const count = await valkey.get("stats:active_jobs");
  return parseInt(count || "0");
}
