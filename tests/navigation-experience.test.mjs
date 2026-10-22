import test from "node:test";
import assert from "node:assert/strict";
import { getScrollInstruction, restoreScroll } from "../src/components/navigation/scrollPolicy.js";

const location = (pathname, search = "", hash = "") => ({ pathname, search, hash });

test("filters, search, sorting and pagination preserve scroll on the same route", () => {
  for (const search of ["?search=quran", "?subject=quran", "?sort=newest", "?page=2"]) {
    assert.deepEqual(getScrollInstruction({ previous: location("/courses"), location: location("/courses", search), navigationType: "PUSH" }), { type: "preserve" });
  }
});
test("new routes start at the top but Back/Forward restore the saved entry", () => {
  const input = { previous: location("/courses"), location: location("/courses/example"), navigationType: "PUSH", saved: { x: 0, y: 900 } };
  assert.deepEqual(getScrollInstruction(input).position, { x: 0, y: 0 });
  assert.deepEqual(getScrollInstruction({ ...input, navigationType: "POP" }).position, input.saved);
});
test("return-to-catalog state restores the source position even on a new history entry", () => {
  const requested = { x: 0, y: 1400 };
  assert.deepEqual(getScrollInstruction({ previous: location("/courses/example"), location: location("/courses", "?level=Beginner"), navigationType: "PUSH", requested }).position, requested);
});
test("a newer history position wins over an older catalog-return hint", () => {
  assert.equal(getScrollInstruction({ previous: location("/courses/example"), location: location("/courses"), navigationType: "POP", saved: { x: 0, y: 2000 }, requested: { x: 0, y: 900 } }).position.y, 2000);
});
test("anchor navigation is honored; an unrecorded first load preserves browser position", () => {
  assert.deepEqual(getScrollInstruction({ previous: location("/courses"), location: location("/courses", "", "#self-paced-catalog") }), { type: "anchor", hash: "#self-paced-catalog" });
  assert.deepEqual(getScrollInstruction({ location: location("/courses"), navigationType: "POP" }), { type: "preserve" });
});

function environment({ height = 700, pending = false } = {}) {
  const events = new Map();
  const frames = new Map();
  const timers = new Map();
  const observers = [];
  const scrolls = [];
  let sequence = 0;
  class Observer {
    constructor(callback) { this.callback = callback; this.active = true; observers.push(this); }
    observe() {}
    disconnect() { this.active = false; }
  }
  const win = {
    innerHeight: 700,
    scrollTo: (value) => scrolls.push(value),
    requestAnimationFrame: (fn) => { const id = ++sequence; frames.set(id, fn); return id; },
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout: (fn) => { const id = ++sequence; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
    addEventListener: (event, fn) => events.set(event, fn),
    removeEventListener: (event) => events.delete(event),
    ResizeObserver: Observer, MutationObserver: Observer,
  };
  const doc = { body: {}, documentElement: { scrollHeight: height }, getElementById: () => null, querySelector: () => pending };
  return { win, doc, events, timers, scrolls, observers,
    settle() { for (const observer of observers) if (observer.active) observer.callback(); for (const [id, fn] of frames) { frames.delete(id); fn(); } },
    ready() { pending = false; },
  };
}

test("history restoration waits for API content, then restores once without smooth travel", () => {
  const env = environment({ height: 3000, pending: true });
  restoreScroll({ type: "position", position: { x: 0, y: 1200 } }, env.win, env.doc);
  assert.equal(env.scrolls.length, 0);
  env.ready(); env.settle(); env.settle();
  assert.deepEqual(env.scrolls, [{ left: 0, top: 1200, behavior: "instant" }]);
  assert.equal(env.events.size, 0);
  assert.equal(env.timers.size, 0);
});
test("short loading screens do not clamp a saved deep scroll position", () => {
  const env = environment();
  restoreScroll({ type: "position", position: { x: 0, y: 1400 } }, env.win, env.doc);
  assert.equal(env.scrolls.length, 0);
  env.doc.documentElement.scrollHeight = 2500; env.settle();
  assert.equal(env.scrolls[0].top, 1400);
});
test("user scroll intent and route cleanup both cancel delayed restoration", () => {
  for (const cancelWith of ["wheel", "touchstart", "pointerdown", "keydown", "cleanup"]) {
    const env = environment();
    const cancel = restoreScroll({ type: "position", position: { x: 0, y: 1400 } }, env.win, env.doc);
    if (cancelWith === "cleanup") cancel();
    else env.events.get(cancelWith)({ type: cancelWith, key: "PageDown" });
    env.doc.documentElement.scrollHeight = 3000; env.settle();
    assert.equal(env.scrolls.length, 0);
    assert.equal(env.events.size, 0);
  }
});
test("lazy hash targets are decoded and scrolled to when their section appears", () => {
  const env = environment();
  restoreScroll({ type: "anchor", hash: "#course%20content" }, env.win, env.doc);
  let anchorScroll;
  env.doc.getElementById = (id) => id === "course content" ? { scrollIntoView: (options) => { anchorScroll = options; } } : null;
  env.settle();
  assert.deepEqual(anchorScroll, { block: "start", behavior: "instant" });
});
test("restoration deadline is bounded when a destination remains too short", () => {
  const env = environment();
  restoreScroll({ type: "position", position: { x: 0, y: 1400 } }, env.win, env.doc);
  [...env.timers.values()][0]();
  assert.equal(env.scrolls.length, 1);
  assert.ok(env.observers.every((observer) => !observer.active));
});
