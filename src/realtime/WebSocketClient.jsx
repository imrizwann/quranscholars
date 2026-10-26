import { useEffect } from "react";

export default function WebSocketClient() {
  useEffect(() => {
    const url = new URL(import.meta.env.VITE_API_URL || "http://localhost:3000");
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    // This connection has no customer-facing messages yet.
    return () => socket.close();
  }, []);
  return null;
}
