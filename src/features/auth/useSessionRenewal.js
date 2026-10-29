import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRefreshSessionMutation } from "@/services/api/user/userAuthApis.js";
import { invalidateAuthRequests } from "@/services/api/base-query.js";

export default function useSessionRenewal() {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const [refresh] = useRefreshSessionMutation();
  useEffect(() => {
    if (!user?._id || !Number.isFinite(user.expires)) return;
    let timer, stopped = false, running = false;
    const renew = async () => {
      if (stopped || running) return;
      running = true;
      const result = await refresh();
      running = false;
      // Temporary outages must not sign the user out or unmount an upload.
      if (!stopped && result.error && result.error.status !== 401) timer = setTimeout(renew, 30_000);
    };
    timer = setTimeout(renew, Math.max(0, user.expires - Date.now() - 60_000));
    const wake = () => {
      if (user.expires - Date.now() <= 60_000) { clearTimeout(timer); void renew(); }
    };
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => { stopped = true; clearTimeout(timer); window.removeEventListener("focus", wake); window.removeEventListener("online", wake); document.removeEventListener("visibilitychange", wake); };
  }, [user?._id, user?.expires, refresh]);

  useEffect(() => {
    const sync = (event) => {
      if (event.key !== "user") return;
      try {
        const previous = event.oldValue ? JSON.parse(event.oldValue) : null;
        const current = event.newValue ? JSON.parse(event.newValue) : null;
        if (previous?._id !== current?._id || previous?.role !== current?.role) invalidateAuthRequests();
        dispatch({ type: "user/setUser", payload: current });
      }
      catch { /* Ignore malformed browser storage; the API remains authoritative. */ }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [dispatch]);
}
