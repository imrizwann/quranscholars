import { useEffect } from "react";

export default function WebSocketClient() {
  useEffect(() => {
    const url = new URL(import.meta.env.VITE_API_URL || "http://localhost:3000");
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    socket.onmessage = event => console.log("Server sent:", event.data);
    return () => socket.close();
  }, []);
  return <div>WebSocketClient</div>;
}
