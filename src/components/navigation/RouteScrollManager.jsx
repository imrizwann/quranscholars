import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { getScrollInstruction, restoreScroll } from "./scrollPolicy.js";

const STORAGE_KEY = "quranscholar-scroll-v1";
const positions = new Map();
const locationUrl = (location) => location.pathname + location.search;
const remember = (key, value) => {
  positions.delete(key);
  positions.set(key, value);
  if (positions.size > 50) positions.delete(positions.keys().next().value);
};
const persist = () => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...positions])); } catch { /* Memory still works when storage is blocked. */ }
};

export default function RouteScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.addEventListener("pagehide", persist);
    return () => {
      window.history.scrollRestoration = original;
      window.removeEventListener("pagehide", persist);
    };
  }, []);

  useLayoutEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      try {
        const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
        for (const [key, value] of stored.slice(-50)) {
          if (typeof key === "string" && typeof value?.url === "string" && Number.isFinite(value.x) && Number.isFinite(value.y) && value.y >= 0) remember(key, value);
        }
      } catch { /* Ignore unavailable or stale session storage. */ }
    }
    const url = locationUrl(location);
    const saved = positions.get(location.key);
    const requested = positions.get(location.state?.restoreScrollKey);
    const instruction = getScrollInstruction({
      previous: previous.current, location, navigationType,
      saved: saved?.url === url ? saved : null,
      requested: requested?.url === url ? requested : null,
    });
    previous.current = location;
    persist();
    const cancel = restoreScroll(instruction);
    const record = () => remember(location.key, { url, x: window.scrollX, y: window.scrollY });
    // Do not overwrite a deferred history restoration with a short loading screen.
    if (instruction.type === "preserve") record();
    window.addEventListener("scroll", record, { passive: true });
    document.addEventListener("click", record, true);
    return () => {
      cancel();
      window.removeEventListener("scroll", record);
      document.removeEventListener("click", record, true);
    };
  }, [location, navigationType]);
  return null;
}
