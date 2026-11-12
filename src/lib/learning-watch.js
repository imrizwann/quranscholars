// Watch IDs remain in memory. The API owns duration, coverage and completion.
export const WATCH_REPORT_INTERVAL = 5000;
export function createLearningWatch({ start, heartbeat, onLesson = () => {}, onStatus, now = Date.now }) {
  let session = null, pending = false, queued = [], playing = false, position = 0, disposed = false, blocked = false, restart = false, complete = false;
  let seeking = false;
  let lastReportAt = 0;
  let failedRequest = null;
  const retryable = error => [500, 502, 503, 504, "FETCH_ERROR", "TIMEOUT_ERROR"].includes(error?.status);
  const status = (value, error) => { if (!disposed) onStatus(value, error); };
  const accept = data => {
    // Completion and resume position are separate. Keep saving after the
    // completion threshold, during replays and until the learner stops playback.
    complete = data.lesson.completed === true;
    if (!disposed) { onLesson(data.lesson); status(complete ? "complete" : "saved"); }
  };
  const enqueue = update => {
    // Keep immutable positions across seek/end events while a request is in flight.
    if (queued.at(-1)?.event === update.event) queued[queued.length - 1] = update;
    else queued.push(update);
    // Repeated seeks must not create an unbounded request queue. Resetting the
    // baseline discards uncertain coverage rather than crediting skipped video.
    if (queued.length > 8) queued = [{ event: "seek", position: update.position }];
  };
  const finish = () => {
    pending = false;
    // A route change can occur during the last heartbeat. Finish the bounded
    // save queue, but never update the UI belonging to the departed lesson.
    if (queued.length && session && !blocked) { void send(queued.shift()); return; }
    if (!disposed && restart && !blocked) { restart = false; session = null; if (playing) void connect(); }
  };
  async function connect(startPosition = position) {
    if (pending || disposed || blocked) return;
    pending = true; lastReportAt = now(); status("saving");
    try {
      const data = await start({ position: startPosition });
      failedRequest = null;
      session = { watchId: data.watchId, sequence: data.sequence }; accept(data);
    } catch (error) { failedRequest = retryable(error) ? { startPosition } : null; blocked = true; status("error", error); }
    finally { finish(); }
  }
  async function send(update = { event: "tick", position }) {
    if (blocked) return;
    lastReportAt = now();
    if (pending) { enqueue(update); return; }
    if (!session) return;
    pending = true; status(complete ? "complete" : "saving");
    try {
      const data = await heartbeat({ ...session, sequence: session.sequence + 1, ...update });
      failedRequest = null;
      session.sequence = data.sequence; accept(data);
    } catch (error) { failedRequest = retryable(error) ? { update } : null; blocked = true; status("error", error); }
    finally { finish(); }
  }
  const report = () => {
    if (!disposed && playing && !seeking && now() - lastReportAt >= WATCH_REPORT_INTERVAL) void send();
  };
  const snapshot = () => ({ event: seeking ? "seek" : "tick", position });
  return {
    update(value) {
      if (disposed || seeking) return;
      if (Number.isFinite(value)) position = Math.max(0, value);
      // Media events continue during playback when browsers throttle interval
      // timers in background tabs. Both paths share the same reporting cadence.
      report();
    },
    play(value) { if (disposed) return; if (Number.isFinite(value)) position = value; if (playing && !blocked) return; playing = true; blocked = false; if (pending) { restart = true; return; } session = null; void connect(); },
    pause(value) { if (disposed) return; if (Number.isFinite(value)) position = value; playing = false; void send(snapshot()); },
    seeking() {
      if (disposed || seeking) return;
      // Save the last observed frame before seeking, then ignore time updates
      // until seeked. Vidstack emits a time update at the destination first.
      if (playing) void send();
      seeking = true;
    },
    seek(value) { if (disposed) return; seeking = false; if (Number.isFinite(value)) position = value; void send({ event: "seek", position }); },
    tick: report,
    retry() {
      if (disposed || pending) return;
      blocked = false;
      // Retry the same sequence and position, including when the video has
      // already ended. Starting afresh here would discard unsaved coverage.
      if (failedRequest?.update && session) { void send(failedRequest.update); return; }
      if (failedRequest && "startPosition" in failedRequest) { void connect(failedRequest.startPosition); return; }
      session = null; if (playing) void connect(); else status("ready");
    },
    flush() { if (!disposed && (session || pending) && !blocked) void send(snapshot()); },
    dispose() { if (disposed) return; if ((session || pending) && !blocked) void send(snapshot()); disposed = true; playing = false; },
  };
}
