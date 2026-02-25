import { Hono } from "hono";
import { getRecentEvents } from "../cache/valkey";

export const eventsRoute = new Hono();

eventsRoute.get("/events", async (c) => {
  const limitParam = c.req.query("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "50") || 50, 1), 100);
  const events = await getRecentEvents(limit);
  return c.json({ events });
});
