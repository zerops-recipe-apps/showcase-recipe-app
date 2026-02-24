import { connect, type NatsConnection, StringCodec } from "nats";
import { config } from "../config";

export let nc: NatsConnection;
export const sc = StringCodec();

export async function initNats() {
  nc = await connect({
    servers: `${config.nats.host}:${config.nats.port}`,
    name: "pipeline-api",
    user: config.nats.user,
    pass: config.nats.password,
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 2000,
  });

  console.log(`[nats] Connected to ${config.nats.host}:${config.nats.port}`);

  (async () => {
    for await (const status of nc.status()) {
      console.log(`[nats] Status: ${status.type}`, status.data || "");
    }
  })();
}
