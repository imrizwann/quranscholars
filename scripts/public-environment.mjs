const publicNames = new Set([
  "VITE_API_URL",
  "VITE_GOOGLE_CLIENT_ID",
  "VITE_PUBLIC_SITE_URL",
  "VITE_COURSE_MEDIA_BASE_URL",
  "VITE_REALTIME_URL",
  "VITE_CATALOGUE_LAYOUT",
  "VITE_HOME_HERO_LAYOUT",
  "VITE_USER_NODE_ENV",
]);
const vercelPublicNames = new Set([
  "VITE_VERCEL_GIT_REPO_ID",
  "VITE_VERCEL_ENV",
]);
function publicUrl(name, value, { originOnly = false, realtime = false } = {}) {
  try {
    const url = new URL(value);
    if (
      !(realtime ? ["https:", "wss:"] : ["https:"]).includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (originOnly && url.pathname !== "/")
    )
      throw new Error();
    return url;
  } catch {
    throw new Error(
      `${name} must be a public HTTPS${realtime ? " or WSS" : ""} ${originOnly ? "origin" : "URL"} without credentials, queries or fragments`,
    );
  }
}

export function validatePublicEnvironment(env) {
  if (env.VITE_GOOGLE_CLIENT_ID && !/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(env.VITE_GOOGLE_CLIENT_ID.trim())) throw new Error("VITE_GOOGLE_CLIENT_ID must be a Google Web application client ID, not a client secret");
  console.log("VALIDATOR DEBUG", {
    apiUrlAllowed: publicNames.has("VITE_API_URL"),
    publicNames: [...publicNames],
  });
  for (const name of Object.keys(env)) {
    if (name.startsWith("VITE_")) {
      console.log("ENV CHECK:", {
        name: JSON.stringify(name),
        length: name.length,
        allowed: publicNames.has(name),
        isVercel: name.startsWith("VITE_VERCEL_"),
      });
    }
    if (
      name.startsWith("VITE_") &&
      !name.startsWith("VITE_VERCEL_") &&
      !publicNames.has(name)
    ) {
      throw new Error(
        `Unexpected public variable ${name}; keep credentials in the backend environment`,
      );
    }
  }
  if (env.VITE_API_URL !== "/")
    publicUrl("VITE_API_URL", env.VITE_API_URL, { originOnly: true });
  publicUrl("VITE_PUBLIC_SITE_URL", env.VITE_PUBLIC_SITE_URL, {
    originOnly: true,
  });
  if (env.VITE_COURSE_MEDIA_BASE_URL)
    publicUrl("VITE_COURSE_MEDIA_BASE_URL", env.VITE_COURSE_MEDIA_BASE_URL);
  if (env.VITE_REALTIME_URL && env.VITE_REALTIME_URL !== "/")
    publicUrl("VITE_REALTIME_URL", env.VITE_REALTIME_URL, {
      originOnly: true,
      realtime: true,
    });
  if (
    env.VITE_CATALOGUE_LAYOUT &&
    !["featured", "full"].includes(env.VITE_CATALOGUE_LAYOUT)
  ) {
    throw new Error("VITE_CATALOGUE_LAYOUT must be featured or full");
  }
  if (
    env.VITE_HOME_HERO_LAYOUT &&
    !["current", "video", "path", "editorial"].includes(env.VITE_HOME_HERO_LAYOUT)
  ) {
    throw new Error("VITE_HOME_HERO_LAYOUT must be current, video, path or editorial");
  }
}
