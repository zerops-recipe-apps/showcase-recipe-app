import { nc, sc } from "./client";
import { wsManager } from "../ws/manager";
import { getPublicUrl } from "../storage/s3";
import { decrementActiveJobs } from "../cache/valkey";
import type { WSMessage } from "../ws/protocol";

export async function subscribeToWorkerResults() {
  const stepSub = nc.subscribe("pipeline.step");
  (async () => {
    for await (const msg of stepSub) {
      try {
        const event = JSON.parse(sc.decode(msg.data));
        const wsMsg: WSMessage = {
          type: "step",
          payload: {
            id: event.id,
            step: event.step,
            detail: event.detail,
            durationMs: event.durationMs,
            timestamp: event.timestamp,
            activeNodes: event.activeNodes,
            activeEdges: event.activeEdges,
            edgeLabels: event.edgeLabels,
          },
        };
        wsManager.broadcast(wsMsg);
      } catch (err) {
        console.error("[nats] Error handling step event:", err);
      }
    }
  })();

  const processedSub = nc.subscribe("pipeline.processed");
  (async () => {
    for await (const msg of processedSub) {
      try {
        const event = JSON.parse(sc.decode(msg.data));
        const thumbnailUrl = getPublicUrl(event.thumbnailKey);
        const resizedUrl = getPublicUrl(event.resizedKey);
        await decrementActiveJobs();

        const wsMsg: WSMessage = {
          type: "processed",
          payload: {
            id: event.id,
            thumbnailUrl,
            resizedUrl,
            metadata: event.metadata,
            totalDurationMs: event.totalDurationMs,
            timestamp: event.timestamp,
            activeNodes: ["api", "app"],
            activeEdges: ["api-app"],
            edgeLabels: { "api-app": `processed (${event.totalDurationMs}ms)` },
          },
        };
        wsManager.broadcast(wsMsg);
      } catch (err) {
        console.error("[nats] Error handling processed event:", err);
      }
    }
  })();

  const errorSub = nc.subscribe("pipeline.error");
  (async () => {
    for await (const msg of errorSub) {
      try {
        const event = JSON.parse(sc.decode(msg.data));
        await decrementActiveJobs();

        const wsMsg: WSMessage = {
          type: "error",
          payload: {
            id: event.id,
            error: event.error,
            step: event.step,
            timestamp: event.timestamp,
          },
        };
        wsManager.broadcast(wsMsg);
      } catch (err) {
        console.error("[nats] Error handling error event:", err);
      }
    }
  })();
}
