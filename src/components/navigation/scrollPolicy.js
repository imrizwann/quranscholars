export const getScrollInstruction = ({ previous, location, navigationType, saved, requested }) => {
  if (navigationType === "POP" && saved) return { type: "position", position: saved };
  if (requested && (!previous || previous.pathname !== location.pathname)) return { type: "position", position: requested };
  if (location.hash && (!previous || previous.hash !== location.hash || previous.pathname !== location.pathname)) {
    return { type: "anchor", hash: location.hash };
  }
  if (!previous || previous.pathname === location.pathname || location.state?.scroll === "preserve") return { type: "preserve" };
  return { type: "position", position: { x: 0, y: 0 } };
};

// Wait for lazy/API content to create enough height before restoring, and never
// fight the user if they start scrolling while the destination is still loading.
export const restoreScroll = (instruction, win = window, doc = document) => {
  if (instruction.type === "preserve") return () => {};
  let stopped = false;
  let frame;
  let timer;
  let resizeObserver;
  let mutationObserver;
  const stop = () => {
    stopped = true;
    win.cancelAnimationFrame(frame);
    win.clearTimeout(timer);
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) win.removeEventListener(event, onIntent);
  };
  const onIntent = (event) => {
    if (event.type !== "keydown" || ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab"].includes(event.key)) stop();
  };
  const attempt = (force = false) => {
    if (stopped) return;
    if (!force && (instruction.type === "anchor" || instruction.position.y > 0) && doc.querySelector?.('[data-scroll-pending="true"], [data-route-loading="true"]')) return;
    if (instruction.type === "anchor") {
      let id;
      try { id = decodeURIComponent(instruction.hash.slice(1)); } catch { id = instruction.hash.slice(1); }
      const element = doc.getElementById(id);
      if (!element) return;
      element.scrollIntoView({ block: "start", behavior: "instant" });
    } else {
      const { x, y } = instruction.position;
      if (!force && doc.documentElement.scrollHeight - win.innerHeight < y) return;
      win.scrollTo({ left: x, top: y, behavior: "instant" });
    }
    stop();
  };
  const schedule = () => {
    win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(() => attempt());
  };
  for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) win.addEventListener(event, onIntent, { passive: true });
  if (win.ResizeObserver) {
    resizeObserver = new win.ResizeObserver(schedule);
    resizeObserver.observe(doc.body);
  }
  if (win.MutationObserver) {
    mutationObserver = new win.MutationObserver(schedule);
    mutationObserver.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-scroll-pending", "data-route-loading"] });
  }
  timer = win.setTimeout(() => { attempt(true); stop(); }, 5000);
  attempt();
  return stop;
};
