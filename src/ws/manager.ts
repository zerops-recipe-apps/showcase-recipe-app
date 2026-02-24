import type { ServerWebSocket } from "bun";
import type { WSMessage } from "./protocol";

class WebSocketManager {
  private clients = new Set<ServerWebSocket<unknown>>();

  add(ws: ServerWebSocket<unknown>) {
    this.clients.add(ws);
    console.log(`[ws] Client connected (total: ${this.clients.size})`);

    const msg: WSMessage = {
      type: "connected",
      payload: {
        clientId: crypto.randomUUID(),
        activeUploads: 0,
        totalProcessed: 0,
      },
    };
    ws.send(JSON.stringify(msg));
  }

  remove(ws: ServerWebSocket<unknown>) {
    this.clients.delete(ws);
    console.log(`[ws] Client disconnected (total: ${this.clients.size})`);
  }

  broadcast(message: WSMessage) {
    const data = JSON.stringify(message);
    let sent = 0;
    for (const client of this.clients) {
      try {
        client.send(data);
        sent++;
      } catch {
        this.clients.delete(client);
      }
    }
    if (sent > 0) {
      console.log(`[ws] Broadcast ${message.type} to ${sent} clients`);
    }
  }

  get clientCount() {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();
