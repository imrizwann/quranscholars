// Watch IDs remain in memory. The API owns duration, coverage and completion.
export function createLearningWatch({ start, heartbeat, onLesson, onStatus, now = Date.now }) {
  let session = null, pending = false, queued = [], playing = false, position = 0, disposed = false, blocked = false, restart = false, complete = false;
  let lastReportAt = 0;
  let failedRequest = null;
  const retryable = error => [500, 502, 503, 504, "FETCH_ERROR", "TIMEOUT_ERROR"].includes(error?.status);
  const status = (value, error) => { if (!disposed) onStatus(value, error); };
  const accept = data => {
    if (data.lesson.completed) { playing = false; complete = true; queued = []; }
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
    if (queued.length && session && !blocked && !complete) { void send(queued.shift()); return; }
    if (!disposed && restart && !blocked && !complete) { restart = false; session = null; if (playing) void connect(); }
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
    if (blocked || complete) return;
    lastReportAt = now();
    if (pending) { enqueue(update); return; }
    if (!session) return;
    pending = true; status("saving");
    try {
      const data = await heartbeat({ ...session, sequence: session.sequence + 1, ...update });
      failedRequest = null;
      session.sequence = data.sequence; accept(data);
    } catch (error) { failedRequest = retryable(error) ? { update } : null; blocked = true; status("error", error); }
    finally { finish(); }
  }
  return {
    update(value) {
      if (disposed) return;
      if (Number.isFinite(value)) position = Math.max(0, value);
      // Media events continue during playback when browsers throttle interval
      // timers in background tabs. Both paths share the same reporting cadence.
      if (playing && now() - lastReportAt >= 10000) void send();
    },
    play(value) { if (disposed || complete) return; if (Number.isFinite(value)) position = value; if (playing && !blocked) return; playing = true; blocked = false; if (pending) { restart = true; return; } session = null; void connect(); },
    pause(value) { if (disposed) return; if (Number.isFinite(value)) position = value; playing = false; void send(); },
    seek(value) { if (disposed) return; if (Number.isFinite(value)) position = value; void send({ event: "seek", position }); },
    tick() { if (!disposed && playing) void send(); },
    retry() {
      if (disposed || complete || pending) return;
      blocked = false;
      // Retry the same sequence and position, including when the video has
      // already ended. Starting afresh here would discard unsaved coverage.
      if (failedRequest?.update && session) { void send(failedRequest.update); return; }
      if (failedRequest && "startPosition" in failedRequest) { void connect(failedRequest.startPosition); return; }
      session = null; if (playing) void connect(); else status("ready");
    },
    dispose() { if (disposed) return; if ((session || pending) && !blocked && !complete) void send(); disposed = true; playing = false; },
  };
}
