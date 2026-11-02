import { test } from "node:test";
import assert from "node:assert/strict";
import { createRealtimeClient, parseRealtimeEvent, realtimeUrl } from "../src/realtime/client.js";

const courseId = "a".repeat(24), sectionId = "b".repeat(24), lessonId = "c".repeat(24);
test("realtime URLs use the existing API origin without tokens and reject insecure production endpoints", () => {
  assert.equal(realtimeUrl("/", "https://www.quranscholar.in"), "wss://www.quranscholar.in/api/realtime");
  assert.equal(realtimeUrl("http://localhost:3000", "http://localhost:3001"), "ws://localhost:3000/api/realtime");
  assert.throws(() => realtimeUrl("ws://example.test", "https://frontend.test"));
  for (const base of ["https://a:b@example.test", "https://example.test?token=secret", "javascript:alert(1)"]) assert.throws(() => realtimeUrl(base, "https://frontend.test"));
});
test("live events accept only scoped status hints and never client-visible credentials or arbitrary fields", () => {
  const event = { v: 1, type: "video.updated", courseId, sectionId, lessonId, status: "COMPLETED", notificationsChanged: true };
  assert.deepEqual(parseRealtimeEvent(JSON.stringify(event)), event);
  for (const bad of [{ ...event, userId: courseId }, { ...event, token: "private" }, { ...event, courseId: "other" }, { ...event, status: "Published" }, { ...event, sectionId: undefined }, { v: 1, type: "ready", extra: true }]) assert.equal(parseRealtimeEvent(JSON.stringify(bad)), null);
  assert.equal(parseRealtimeEvent("{"), null); assert.equal(parseRealtimeEvent("x".repeat(2049)), null);
});
function harness(options = {}) {
  let now = 0, sequence = 0;
  const timers = new Map(), sockets = [], events = [], statuses = [];
  class Socket {
    constructor(url) { this.url = url; this.readyState = 0; this.sent = []; sockets.push(this); }
    receive(event) { this.readyState = 1; this.onmessage({ data: JSON.stringify(event) }); }
    send(message) { this.sent.push(JSON.parse(message)); }
    close(code = 1006) { this.readyState = 3; this.onclose?.({ code }); }
  }
  const client = createRealtimeClient({ url: "wss://example.test/api/realtime", Socket, onEvent: event => events.push(event), onStatus: value => statuses.push(value),
    setTimer: (fn, ms) => { timers.set(++sequence, { fn, at: now + ms }); return sequence; }, clearTimer: id => timers.delete(id), random: () => .5, ...options });
  const advance = async ms => {
    const end = now + ms;
    for (;;) {
      const next = [...timers].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at; timers.delete(next[0]); next[1].fn(); await Promise.resolve();
    }
    now = end; await Promise.resolve();
  };
  return { client, sockets, timers, events, statuses, advance };
}
test("reconnect backs off until authentication is ready and reloads state on every ready event", async () => {
  const h = harness();
  h.sockets[0].close(); await h.advance(1000); assert.equal(h.sockets.length, 2);
  h.sockets[1].close(); await h.advance(1999); assert.equal(h.sockets.length, 2);
  await h.advance(1); assert.equal(h.sockets.length, 3);
  h.sockets[2].receive({ v: 1, type: "ready" }); assert.equal(h.statuses.at(-1), true);
  h.sockets[2].close(); await h.advance(1000); assert.equal(h.sockets.length, 4);
  h.sockets[3].receive({ v: 1, type: "ready" }); assert.equal(h.events.length, 2);
  h.client.stop(); assert.equal(h.timers.size, 0);
});
test("heartbeats detect a dead connection and pong keeps a healthy connection open", async () => {
  const h = harness(); h.sockets[0].receive({ v: 1, type: "ready" });
  await h.advance(25_000); assert.deepEqual(h.sockets[0].sent, [{ v: 1, type: "ping" }]);
  h.sockets[0].receive({ v: 1, type: "pong" }); await h.advance(25_000);
  assert.equal(h.sockets[0].readyState, 1); assert.equal(h.events.length, 1);
  await h.advance(10_000); assert.equal(h.statuses.at(-1), false);
  await h.advance(1000); assert.equal(h.sockets.length, 2); h.client.stop();
});
test("logout/account cleanup cancels reconnection, ignores late messages and cannot revive a pending renewal", async () => {
  let finish; const h = harness({ verifySession: () => new Promise(resolve => { finish = resolve; }) });
  const socket = h.sockets[0]; socket.receive({ v: 1, type: "ready" }); socket.close(4401);
  h.client.stop(); finish(); await h.advance(60_000);
  socket.receive({ v: 1, type: "video.updated", courseId, status: "FAILED" });
  assert.equal(h.sockets.length, 1); assert.equal(h.events.length, 1); assert.equal(h.timers.size, 0); assert.equal(h.statuses.at(-1), false);
});
test("an opening connection times out and online wake does not duplicate an active socket", async () => {
  const h = harness(); h.client.wake(); assert.equal(h.sockets.length, 1);
  await h.advance(12_000); h.client.wake(); assert.equal(h.sockets.length, 2);
  await h.advance(1000); assert.equal(h.sockets.length, 2); h.client.stop();
});
