import { useEffect, useRef } from "react";
import { usePipelineStore } from "../store/pipeline";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handleWSMessage = usePipelineStore((s) => s.handleWSMessage);
  const setConnected = usePipelineStore((s) => s.setConnected);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let intentionalClose = false;

    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[ws] Connected");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleWSMessage(msg);
        } catch (err) {
          console.warn("[ws] Failed to parse message:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!intentionalClose) {
          console.log("[ws] Disconnected — reconnecting in 2s");
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = (err) => {
        console.error("[ws] Error:", err);
        ws.close();
      };
    }

    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 30000);

    return () => {
      intentionalClose = true;
      clearTimeout(reconnectTimer);
      clearInterval(pingInterval);
      wsRef.current?.close();
    };
  }, [handleWSMessage, setConnected]);
}
