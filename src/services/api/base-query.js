import { fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import { transientRetryOptions } from "./transient-retry.js";

// Shared by API slices only; direct storage uploads must use their own request.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
  credentials: "include",
  prepareHeaders(headers, { arg }) {
    const method = (
      typeof arg === "string" ? "GET" : arg.method || "GET"
    ).toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method))
      headers.set("X-CSRF-Protection", "1");
    return headers;
  },
});

const accountQuery = retry(rawBaseQuery, transientRetryOptions);

let refreshPromise;
let refreshRevision = 0;
let authChange = 0;
let authChanging = false;
let authQueue = Promise.resolve();

export function invalidateAuthRequests() { authChange++; }

// Browser locks coordinate cookies across tabs. The local queue covers older
// browsers; the server also tolerates a brief simultaneous rotation overlap.
function authLock(work) {
  const run = () => globalThis.navigator?.locks?.request
    ? navigator.locks.request("quranscholar-auth", work)
    : work();
  const task = authQueue.then(run, run);
  authQueue = task.catch(() => {});
  return task;
}

export function renewSession(api, extraOptions) {
  if (refreshPromise) return refreshPromise;
  const version = authChange;
  // One cancelled query must not cancel renewal shared by other requests.
  const refreshApi = { ...api, signal: new AbortController().signal };
  refreshPromise = authLock(async () => {
    if (version !== authChange || authChanging) return { error: { status: 401, data: {} } };
    // Another tab may already have refreshed while this one waited for the lock.
    let result = await accountQuery({ url: "/api/auth/me", timeout: 10_000 }, refreshApi, extraOptions);
    if (result.error && result.error.status !== 401) return result;
    if (!result.data?.expires || result.data.expires <= Date.now() + 60_000) {
      result = await rawBaseQuery({ url: "/api/auth/refresh", method: "POST", timeout: 10_000 }, refreshApi, extraOptions);
    }
    if (version !== authChange) return { error: { status: 401, data: {} } };
    if (result.data?._id && Number.isFinite(result.data.expires)) {
      refreshRevision++;
      api.dispatch({ type: "user/setUser", payload: result.data });
    } else if (result.error?.status === 401) {
      api.dispatch({ type: "user/setUser", payload: null });
    } else if (!result.error) {
      return { error: { status: "CUSTOM_ERROR", error: "Invalid session response" } };
    }
    return result;
  }).finally(() => { refreshPromise = undefined; });
  return refreshPromise;
}

export async function apiBaseQuery(args, api, extraOptions) {
  const path = (typeof args === "string" ? args : args.url).replace(/^\//, "").split("?")[0];
  if (["api/auth/login", "api/auth/logout", "api/auth/delete_profile"].includes(path)) {
    authChange++; authChanging = true;
    try { return await authLock(() => rawBaseQuery(args, api, extraOptions)); }
    finally { authChanging = false; }
  }
  const revision = refreshRevision;
  const version = authChange;
  const checkAccount = path === "api/auth/me";
  const request = checkAccount ? accountQuery : rawBaseQuery;
  const requestArgs = checkAccount
    ? { ...(typeof args === "string" ? { url: args } : args), timeout: 10_000 }
    : args;
  let result = await request(requestArgs, api, extraOptions);
  if (version !== authChange) return { error: { status: 401, data: {} } };
  if (result.error?.status !== 401 || api.signal.aborted || authChanging || version !== authChange || (path.startsWith("api/auth/") && path !== "api/auth/me")) return result;
  const renewed = revision === refreshRevision ? await renewSession(api, extraOptions) : { data: true };
  if (api.signal.aborted || version !== authChange) return result;
  if (renewed.error) return renewed;
  // Authentication middleware rejected the first request before its handler ran.
  // Retry it once; never replay other failures or storage uploads.
  result = await request(requestArgs, api, extraOptions);
  return result;
}
