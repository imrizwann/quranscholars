import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import userAuthApi, { useRequestEmailVerificationMutation, useVerifyEmailMutation } from "@/services/api/user/userAuthApis.js";
import useEmailActionToken from "@/features/auth/useEmailActionToken.js";
import AuthPage from "@/features/auth/components/AuthPage.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";

export default function VerifyEmail() {
  const { token, setToken, valid } = useEmailActionToken();
  const user = useSelector(state => state.user.user);
  const [done, setDone] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [verify, checking] = useVerifyEmailMutation(), [resend, sending] = useRequestEmailVerificationMutation();
  const pending = useRef(false), dispatch = useDispatch();
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000); return () => clearTimeout(timer); }, [cooldown]);
  async function confirm() {
    if (pending.current || !valid) return; pending.current = true; setError("");
    try { await verify(token).unwrap(); setDone(true); setToken(""); if (user?._id) dispatch(userAuthApi.endpoints.me.initiate(undefined, { subscribe: false, forceRefetch: true })); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; }
  }
  async function send() {
    if (pending.current) return; pending.current = true; setError("");
    try { const result = await resend().unwrap(); setMessage(result.message); setCooldown(60); if (user?._id) dispatch(userAuthApi.endpoints.me.initiate(undefined, { subscribe: false, forceRefetch: true })); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; }
  }
  const verified = done || (!token && user?.emailVerified);
  return <AuthPage title={verified ? "Email verified" : "Verify your email"} description={verified ? "Your email address is confirmed. Thank you for keeping your account up to date." : "Confirm your email address to help keep your QuranScholar account secure."} footer={<Link className="font-semibold text-primary hover:underline" to={user ? "/profile" : "/login"}>{user ? "Back to your profile" : "Back to sign in"}</Link>}>
    {verified ? <div role="status"><CheckCircle2 size={28} className="text-primary" aria-hidden="true" /><Link to={user ? "/dashboard/learning" : "/login"} className="cw-button cw-primary mt-5">{user ? "Continue learning" : "Sign in"}</Link></div> : <div className="space-y-4">
      <Mail size={28} className="text-primary" aria-hidden="true" />
      {valid ? <><p className="text-sm leading-6 text-muted-foreground">Select the button below to confirm the email address that received this link.</p><AsyncButton className="cw-button cw-primary" onClick={confirm} loading={checking.isLoading} loadingLabel="Verifying email">Verify email address</AsyncButton></> : token ? <p role="alert" className="text-sm text-destructive">This verification link is incomplete. Please request a new email.</p> : <p className="text-sm leading-6 text-muted-foreground">{user ? `We’ll send a verification link to ${user.email}.` : "Sign in to request a new verification email, or use the link in your inbox."}</p>}
      {!valid && user && (user.verificationEmailAvailable ? <AsyncButton className="cw-button" onClick={send} loading={sending.isLoading} loadingLabel="Sending verification email" disabled={cooldown > 0}>{cooldown ? `Resend in ${cooldown}s` : "Send verification email"}</AsyncButton> : <p className="text-sm leading-6 text-muted-foreground">Email verification is being set up. You can continue using your account.</p>)}
      {!valid && !user && <Link to="/login" state={{ from: "/verify-email" }} className="cw-button cw-primary">Sign in to continue</Link>}
      {message && <p role="status" className="text-sm leading-6 text-primary">{message}</p>}
    </div>}
    {error && <div className="mt-4 space-y-3"><p role="alert" className="text-sm text-destructive">{error}</p>{valid && <button className="cw-button" type="button" onClick={() => { setToken(""); setError(""); }}>Request a new email</button>}</div>}
  </AuthPage>;
}
