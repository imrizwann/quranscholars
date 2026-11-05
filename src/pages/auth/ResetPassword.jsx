import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useResetPasswordMutation } from "@/services/api/user/userAuthApis.js";
import { clearAuthenticatedState } from "@/features/auth/logout.js";
import useEmailActionToken from "@/features/auth/useEmailActionToken.js";
import AuthPage from "@/features/auth/components/AuthPage.jsx";
import AuthInput from "@/features/auth/components/AuthInput.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";

export default function ResetPassword() {
  const { token, setToken, valid } = useEmailActionToken();
  const [password, setPassword] = useState(""), [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false), [error, setError] = useState("");
  const [reset, sending] = useResetPasswordMutation();
  const pending = useRef(false), dispatch = useDispatch();
  async function submit(event) {
    event.preventDefault(); if (pending.current || !valid) return;
    if (password !== confirm) { setError("Your passwords don’t match. Please enter them again."); return; }
    if (password.length < 8) { setError("Use at least 8 characters for your password."); return; }
    if (new TextEncoder().encode(password).length > 72) { setError("Your password is too long. Please use fewer characters."); return; }
    pending.current = true; setError("");
    try { await reset({ token, password }).unwrap(); clearAuthenticatedState(dispatch); setDone(true); setToken(""); setPassword(""); setConfirm(""); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; }
  }
  return <AuthPage title={done ? "Password updated" : "Choose a new password"} description={done ? "Your previous sessions have been signed out. Sign in with your new password to continue." : "Use a password you haven’t used for another account."} footer={<Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}>
    {done ? <div role="status" className="space-y-4"><CheckCircle2 className="text-primary" size={28} aria-hidden="true" /><Link to="/login" className="cw-button cw-primary">Sign in</Link></div> : !valid ? <div><p role="alert" className="text-sm leading-6 text-muted-foreground">This reset link is incomplete. Request a new link to continue.</p><Link to="/forgot-password" className="cw-button cw-primary mt-5">Request a new link</Link></div> : <form onSubmit={submit} aria-label="Reset password" aria-busy={sending.isLoading || undefined}>
      <div className="space-y-5"><AuthInput id="reset-password" name="password" label="New password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required hint="Use at least 8 characters." value={password} onChange={event => setPassword(event.target.value)} disabled={sending.isLoading} /><AuthInput id="reset-confirm" name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirm} onChange={event => setConfirm(event.target.value)} disabled={sending.isLoading} /></div>
      {error && <div className="mt-4 space-y-2"><p role="alert" className="text-sm text-destructive">{error}</p><Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">Request a new link</Link></div>}
      <AsyncButton className="cw-button cw-primary mt-6" type="submit" loading={sending.isLoading} loadingLabel="Updating password">Update password</AsyncButton>
    </form>}
  </AuthPage>;
}
