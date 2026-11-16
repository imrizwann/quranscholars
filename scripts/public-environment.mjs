const publicNames = new Set([
  "VITE_API_URL", "VITE_PUBLIC_SITE_URL", "VITE_COURSE_MEDIA_BASE_URL",
  "VITE_REALTIME_URL", "VITE_CATALOGUE_LAYOUT", "VITE_USER_NODE_ENV",
  "VITE_PAYMENT_CHECKOUT", "VITE_CUSTOM_CHECKOUT_LIVE_ENABLED", "VITE_CUSTOM_CHECKOUT_EMBEDDED_QR",
]);

function publicUrl(name, value, { originOnly = false, realtime = false } = {}) {
  try {
    const url = new URL(value);
    if (!(realtime ? ["https:", "wss:"] : ["https:"]).includes(url.protocol) ||
      url.username || url.password || url.search || url.hash ||
      (originOnly && url.pathname !== "/")) throw new Error();
    return url;
  } catch { throw new Error(`${name} must be a public HTTPS${realtime ? " or WSS" : ""} ${originOnly ? "origin" : "URL"} without credentials, queries or fragments`); }
}

export function validatePublicEnvironment(env) {
  for (const name of Object.keys(env)) {
    if (name.startsWith("VITE_") && !publicNames.has(name)) {
      throw new Error(`Unexpected public variable ${name}; keep credentials in the backend environment`);
    }
  }
  if (env.VITE_API_URL !== "/") publicUrl("VITE_API_URL", env.VITE_API_URL, { originOnly: true });
  publicUrl("VITE_PUBLIC_SITE_URL", env.VITE_PUBLIC_SITE_URL, { originOnly: true });
  if (env.VITE_COURSE_MEDIA_BASE_URL) publicUrl("VITE_COURSE_MEDIA_BASE_URL", env.VITE_COURSE_MEDIA_BASE_URL);
  if (env.VITE_REALTIME_URL && env.VITE_REALTIME_URL !== "/") publicUrl("VITE_REALTIME_URL", env.VITE_REALTIME_URL, { originOnly: true, realtime: true });
  if (env.VITE_CATALOGUE_LAYOUT && !["featured", "full"].includes(env.VITE_CATALOGUE_LAYOUT)) {
    throw new Error("VITE_CATALOGUE_LAYOUT must be featured or full");
  }
  if (env.VITE_PAYMENT_CHECKOUT && !["standard", "custom"].includes(env.VITE_PAYMENT_CHECKOUT)) throw new Error("VITE_PAYMENT_CHECKOUT must be standard or custom");
  for (const name of ["VITE_CUSTOM_CHECKOUT_LIVE_ENABLED", "VITE_CUSTOM_CHECKOUT_EMBEDDED_QR"]) {
    if (env[name] && !["true", "false"].includes(env[name])) throw new Error(`${name} must be true or false`);
  }
}
