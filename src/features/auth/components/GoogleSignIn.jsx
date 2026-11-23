import { useEffect, useId, useRef, useState } from "react";
import { useStore } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loadGoogleIdentity, googleAuthRequest } from "../google-identity.js";
import userAuthApi from "@/services/api/user/userAuthApis.js";
import { setUser } from "@/store/slices/userSlice.js";
import { loginDestination } from "@/components/guards/loginDestination.js";
import { userMessage } from "@/lib/user-messages.js";
import AuthInput from "./AuthInput.jsx";

export default function GoogleSignIn(props) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  return clientId ? <GoogleSignInEnabled {...props} clientId={clientId} /> : null;
}

function GoogleSignInEnabled({ clientId, disabled, onBusyChange, returnTo }) {
  const store = useStore(), navigate = useNavigate(), id = useId();
  const container = useRef(null), pending = useRef(false), alive = useRef(false);
  const props = useRef({ disabled, onBusyChange, returnTo });
  props.current = { disabled, onBusyChange, returnTo };
  const [attempt, setAttempt] = useState(0), [ready, setReady] = useState(false);
  const [error, setError] = useState(""), [linkRequired, setLinkRequired] = useState(false), [password, setPassword] = useState("");
  const activeRequest = useRef(null);

  async function authenticate(path, body) {
    if (!alive.current || pending.current || props.current.disabled) return;
    pending.current = true;
    props.current.onBusyChange(true);
    setError("");
    const abort = new AbortController();
    activeRequest.current = abort;
    try {
      const user = await googleAuthRequest(path, body, store, abort.signal);
      if (!alive.current) return;
      if (!user?._id || !["user", "instructor", "admin"].includes(user.role) || !Number.isFinite(user.expires)) throw new Error("Invalid session response");
      await store.dispatch(userAuthApi.util.upsertQueryData("me", undefined, user));
      store.dispatch(setUser(user));
      setPassword("");
      navigate(loginDestination(user, props.current.returnTo), { replace: true });
    } catch (failure) {
      if (!alive.current) return;
      const linking = failure?.data?.code === "GOOGLE_LINK_REQUIRED";
      const retryPassword = path === "google/link" && failure?.data?.code === "GOOGLE_PASSWORD_INVALID";
      setLinkRequired(linking || retryPassword);
      setReady(false);
      setPassword("");
      setError(linking ? "An account already uses this email. Enter its current password to connect Google and sign in." : userMessage(failure, "Google sign-in could not finish. Please try again."));
    } finally {
      pending.current = false;
      if (alive.current) props.current.onBusyChange(false);
    }
  }

  useEffect(() => {
    alive.current = true;
    const abort = new AbortController();
    let current = true;
    setReady(false); setError(""); setLinkRequired(false); setPassword("");
    Promise.all([loadGoogleIdentity(), googleAuthRequest("google/challenge", {}, store, abort.signal)]).then(([google, challenge]) => {
      if (!current) return;
      if (challenge?.clientId !== clientId || typeof challenge.nonce !== "string") throw new Error("Google configuration mismatch");
      google.initialize({ client_id: clientId, nonce: challenge.nonce, auto_select: false, ux_mode: "popup", callback: response => {
        if (current && typeof response?.credential === "string") void authenticate("google", { credential: response.credential });
      } });
      container.current.replaceChildren();
      google.renderButton(container.current, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: Math.max(200, Math.min(400, container.current.clientWidth || 300)), locale: "en" });
      setReady(true);
    }).catch(failure => {
      if (current && !abort.signal.aborted) setError(userMessage(failure, "Google sign-in could not load. Try again, or use email and password below."));
    });
    return () => { current = false; alive.current = false; abort.abort(); activeRequest.current?.abort(); };
    // Restarting creates a fresh browser-bound nonce and replaces the SDK callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, clientId, store]);

  return <div className="auth-google">
    <div ref={container} className="auth-google-button" hidden={Boolean(error) || linkRequired} inert={disabled || !ready ? true : undefined} aria-busy={disabled || !ready || undefined} />
    {!ready && !error && <p className="auth-field-hint" role="status">Loading Google sign-in…</p>}
    {error && <p id={`${id}-message`} className="auth-google-message" role={linkRequired ? "status" : "alert"}>{error}</p>}
    {linkRequired ? <form aria-label="Connect Google account" onSubmit={event => { event.preventDefault(); void authenticate("google/link", { password }); }}>
      <AuthInput id={`${id}-password`} label="Current account password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required maxLength={1024} disabled={disabled} aria-describedby={`${id}-message`} />
      <button className="auth-submit" type="submit" disabled={disabled}>{disabled ? "Connecting…" : "Connect Google and sign in"}</button>
      <Link to="/forgot-password" className="auth-google-recovery">Reset your password</Link>
      <button className="auth-google-retry" type="button" disabled={disabled} onClick={() => setAttempt(value => value + 1)}>Use a different Google account</button>
    </form> : error && <button type="button" className="auth-google-retry" disabled={disabled} onClick={() => setAttempt(value => value + 1)}>Try Google again</button>}
    <div className="auth-google-divider"><span>or continue with email</span></div>
  </div>;
}
