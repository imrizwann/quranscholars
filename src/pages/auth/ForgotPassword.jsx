import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useForgotPasswordMutation } from "@/services/api/user/userAuthApis.js";
import AuthPage from "@/features/auth/components/AuthPage.jsx";
import AuthInput from "@/features/auth/components/AuthInput.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false), [error, setError] = useState("");
  const [request, sending] = useForgotPasswordMutation();
  const pending = useRef(false);
  async function submit(event) {
    event.preventDefault(); if (pending.current || !email.trim()) return;
    pending.current = true; setError("");
    try { await request(email.trim().toLowerCase()).unwrap(); setSent(true); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; }
  }
  return <AuthPage title={sent ? "Check your inbox" : "Forgot your password?"} description={sent ? "If an account matches that email, you’ll receive a password reset link. Please check your spam folder, too." : "Enter your account email and we’ll send you a link to choose a new password."} footer={<Link className="font-semibold text-primary hover:underline" to="/login">Back to sign in</Link>}>
    {sent ? <div role="status" className="space-y-4"><Mail size={28} className="text-primary" aria-hidden="true" /><p className="text-sm leading-6 text-muted-foreground">The link expires in 30 minutes. For your security, it can be used once.</p><button type="button" className="cw-button" onClick={() => setSent(false)}>Use a different email</button></div> : <form onSubmit={submit} aria-label="Request password reset" aria-busy={sending.isLoading || undefined}>
      <AuthInput id="recovery-email" name="email" label="Email address" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} disabled={sending.isLoading} />
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <AsyncButton className="cw-button cw-primary mt-6" type="submit" loading={sending.isLoading} loadingLabel="Requesting reset link">Send reset link</AsyncButton>
    </form>}
  </AuthPage>;
}
