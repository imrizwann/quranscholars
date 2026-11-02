// Watch IDs remain in memory. The API owns duration, coverage and completion.
export function createLearningWatch({ start, heartbeat, onLesson, onStatus }) {
  let session = null, pending = false, queued = null, playing = false, position = 0, disposed = false, blocked = false, restart = false;
  const status = (value, error) => { if (!disposed) onStatus(value, error); };
  const accept = data => { if (!disposed) { onLesson(data.lesson); if (data.lesson.completed) { playing = false; blocked = true; status("complete"); } else status("saved"); } };
  const finish = () => {
    pending = false;
    if (!disposed && restart) { restart = false; session = null; queued = null; blocked = false; if (playing) void connect(); return; }
    if (!disposed && queued && session && !blocked) { const next = queued; queued = null; void send(next); }
  };
  async function connect() {
    if (pending || disposed || blocked) return;
    pending = true; status("saving");
    try {
      const data = await start({ position });
      if (!disposed) { session = { watchId: data.watchId, sequence: data.sequence }; accept(data); }
    } catch (error) { blocked = true; status("error", error); }
    finally { finish(); }
  }
  async function send(event = "tick") {
    if (disposed || blocked) return;
    if (pending) { queued = event === "seek" || queued === "seek" ? "seek" : "tick"; return; }
    if (!session) return;
    pending = true; status("saving");
    try {
      const data = await heartbeat({ ...session, sequence: session.sequence + 1, position, event });
      if (!disposed) { session.sequence = data.sequence; accept(data); }
    } catch (error) { blocked = true; status("error", error); }
    finally { finish(); }
  }
  return {
    update(value) { if (Number.isFinite(value)) position = Math.max(0, value); },
    play(value) { if (Number.isFinite(value)) position = value; if (playing && !blocked) return; playing = true; blocked = false; if (pending) { restart = true; return; } session = null; void connect(); },
    pause(value) { if (Number.isFinite(value)) position = value; playing = false; void send(); },
    seek(value) { if (Number.isFinite(value)) position = value; void send("seek"); },
    tick() { if (playing) void send(); },
    retry() { blocked = false; if (pending) { restart = true; return; } session = null; if (playing) void connect(); else status("ready"); },
    dispose() { if (!disposed && session && !pending && !blocked) void send(); disposed = true; session = null; queued = null; },
  };
}
