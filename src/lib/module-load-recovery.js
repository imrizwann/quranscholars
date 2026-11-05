const RELOAD_KEY = "qs:module-reload";
const RELOAD_INTERVAL = 60_000;

export function isModuleLoadError(error) {
  return typeof error?.message === "string" && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS for/i.test(error.message);
}

export function recoverModuleLoad(error, browser = window, now = Date.now()) {
  if (!isModuleLoadError(error) || browser.navigator.onLine === false) return false;
  try {
    const last = browser.sessionStorage.getItem(RELOAD_KEY);
    if (last !== null && Number.isFinite(Number(last)) && now - Number(last) < RELOAD_INTERVAL) return false;
    // Persist before reloading: another failed import or Strict Mode must not
    // start a loop. If storage is blocked, leave recovery to the visible button.
    browser.sessionStorage.setItem(RELOAD_KEY, String(now));
    browser.location.reload();
    return true;
  } catch { return false; }
}
