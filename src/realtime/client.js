const id = value => typeof value === "string" && /^[a-f0-9]{24}$/.test(value);
export function parseRealtimeEvent(text) {
  if (typeof text !== "string" || text.length > 2048) return null;
  try {
    const event = JSON.parse(text);
    if (event.v !== 1) return null;
    if (["ready", "pong"].includes(event.type)) return Object.keys(event).length === 2 ? event : null;
    const keys = ["v", "type", "courseId", "sectionId", "lessonId", "status", "notificationsChanged"];
    if (event.type !== "video.updated" || Object.keys(event).some(key => !keys.includes(key)) || !id(event.courseId)) return null;
    if (!['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(event.status)) return null;
    if (event.lessonId !== undefined && (!id(event.lessonId) || !id(event.sectionId))) return null;
    if (event.sectionId !== undefined && !id(event.sectionId)) return null;
    if (event.notificationsChanged !== undefined && typeof event.notificationsChanged !== "boolean") return null;
    return event;
  } catch { return null; }
}
export function realtimeUrl(base, origin) {
  const url = new URL(base || "/", origin);
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error("Invalid realtime address");
  if (new URL(origin).protocol === "https:" && ['http:', 'ws:'].includes(url.protocol)) throw new Error("Secure realtime address required");
  url.protocol = ['https:', 'wss:'].includes(url.protocol) ? "wss:" : "ws:";
  url.pathname = "/api/realtime";
  return url.href;
}

// One connection per signed-in tab; cookies remain HttpOnly. State is refreshed
// after every reconnect because live hints are not a durable event history.
export function createRealtimeClient({ url, Socket = globalThis.WebSocket, onEvent, onStatus, verifySession = async () => {},
  setTimer = setTimeout, clearTimer = clearTimeout, random = Math.random }) {
  let socket, timer, timeout, pingTimer, stopped = false, attempt = 0, generation = 0;
  const clear = () => { clearTimer(timer); clearTimer(timeout); clearTimer(pingTimer); };
  const connect = () => {
    if (stopped) return;
    const current = ++generation;
    onStatus(false);
    try { socket = new Socket(url); } catch { schedule(); return; }
    const active = socket;
    const ping = () => {
      if (stopped || current !== generation || active.readyState !== 1) return;
      active.send(JSON.stringify({ v: 1, type: "ping" }));
      timeout = setTimer(() => active.close(), 10_000);
    };
    timeout = setTimer(() => active.close(), 12_000);
    active.onmessage = ({ data }) => {
      if (stopped || current !== generation) return;
      const event = parseRealtimeEvent(data);
      if (!event) return;
      if (event.type === "ready") { clearTimer(timeout); attempt = 0; onStatus(true); clearTimer(pingTimer); pingTimer = setTimer(ping, 25_000); }
      if (event.type === "pong") { clearTimer(timeout); clearTimer(pingTimer); pingTimer = setTimer(ping, 25_000); return; }
      onEvent(event);
    };
    active.onclose = async ({ code }) => {
      if (stopped || current !== generation) return;
      clearTimer(timeout); clearTimer(pingTimer); onStatus(false);
      if (code === 4401) { try { await verifySession(); } catch { /* The shared auth layer handles definitive logout. */ } }
      if (!stopped && current === generation) schedule();
    };
    active.onerror = () => { /* Browsers follow this with close; don't schedule twice. */ };
  };
  const schedule = () => {
    if (stopped) return;
    clearTimer(timer);
    const backoff = Math.min(30_000, 1000 * 2 ** Math.min(attempt++, 5));
    timer = setTimer(connect, backoff * (0.8 + random() * 0.4));
  };
  connect();
  return {
    wake() { if (stopped || socket?.readyState === 1 || socket?.readyState === 0) return; clear(); connect(); },
    stop() { stopped = true; generation++; clear(); socket?.close(); onStatus(false); },
  };
}
