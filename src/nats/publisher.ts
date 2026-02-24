import { nc, sc } from "./client";

export function publishUploaded(event: {
  id: string;
  originalKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const payload = {
    ...event,
    timestamp: Date.now(),
  };
  nc.publish("pipeline.uploaded", sc.encode(JSON.stringify(payload)));
  console.log(`[nats] Published pipeline.uploaded for ${event.id}`);
}
