import { apiBaseQuery } from "@/services/api/base-query.js";

let loading;
export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    const fail = () => { clearTimeout(timer); script.remove(); loading = undefined; reject(new Error("Google sign-in could not load")); };
    const timer = setTimeout(fail, 15_000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.google?.accounts?.id) return fail();
      clearTimeout(timer);
      resolve(window.google.accounts.id);
    };
    document.head.append(script);
  });
  return loading;
}

// Use the shared cookie/CSRF/auth-lock transport without putting a Google JWT
// or linking password in Redux mutation arguments, storage, or URLs.
export async function googleAuthRequest(path, body, store, signal) {
  const result = await apiBaseQuery({ url: `api/auth/${path}`, method: "POST", body, timeout: 15_000 }, {
    signal, dispatch: store.dispatch, getState: store.getState, type: "mutation", endpoint: "googleAuth",
  }, {});
  if (result.error) throw result.error;
  return result.data;
}
