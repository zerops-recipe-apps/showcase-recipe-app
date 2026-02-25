import { nc, sc } from "./client";
import { wsManager } from "../ws/manager";
import { getPublicUrl } from "../storage/s3";
import { decrementActiveJobs, pushEvent } from "../cache/valkey";
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
        await pushEvent({
          id: event.id,
          type: "step",
          timestamp: event.timestamp,
          description: event.detail,
          durationMs: event.durationMs,
        });
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
            activeNodes: ["app", "core", "l7"],
            activeEdges: ["core-app", "core-l7", "l7-app"],
            edgeLabels: {
              "core-app": `processed (${event.totalDurationMs}ms)`,
              "l7-app": `processed (${event.totalDurationMs}ms)`,
            },
          },
        };
        wsManager.broadcast(wsMsg);
        await pushEvent({
          id: event.id,
          type: "processed",
          timestamp: event.timestamp,
          description: `Processed in ${event.totalDurationMs}ms`,
          detail: `${event.metadata.width}x${event.metadata.height}`,
          durationMs: event.totalDurationMs,
        });
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
        await pushEvent({
          id: event.id,
          type: "error",
          timestamp: event.timestamp,
          description: `Error: ${event.error}`,
          detail: `Failed at: ${event.step}`,
        });
      } catch (err) {
        console.error("[nats] Error handling error event:", err);
      }
    }
  })();
}
