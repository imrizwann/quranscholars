import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useRegisterMutation } from "@/services/api/user/userAuthApis.js";
import { userMessage } from "@/lib/user-messages.js";
import AuthPage from "@/features/auth/components/AuthPage.jsx";
import AuthInput from "@/features/auth/components/AuthInput.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pending = useRef(false);
  const [register] = useRegisterMutation();
  const navigate = useNavigate(), location = useLocation();
  const returnTo = typeof location.state?.from === "string" ? location.state.from : undefined;

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    if (!name.trim() || !email.trim() || !password) { setError("Enter your name, email and password to create an account."); return; }
    pending.current = true; setIsLoading(true); setError("");
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password }).unwrap();
      navigate("/login", { replace: true, state: { registrationComplete: true, ...(returnTo && { from: returnTo }) } });
    } catch (failure) { setError(userMessage(failure, "We could not create your account. Please try again.")); }
    finally { pending.current = false; setIsLoading(false); }
  }

  return <AuthPage title="Create your account" description="Learn at your pace or apply to teach. Start with one account." footer={<>Already have an account? <Link to="/login" state={returnTo ? { from: returnTo } : undefined} className="font-semibold text-primary hover:underline">Sign in</Link></>}>
    {error && <p id="register-error" role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
    <form onSubmit={submit} aria-label="Create account" aria-busy={isLoading || undefined} aria-describedby={error ? "register-error" : undefined}>
      <div className="space-y-5">
        <AuthInput id="register-name" name="name" label="Full name" autoComplete="name" autoCapitalize="words" maxLength={120} required value={name} onChange={event => setName(event.target.value)} disabled={isLoading} />
        <AuthInput id="register-email" name="email" label="Email address" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} disabled={isLoading} />
        <AuthInput id="register-password" name="password" label="Password" type="password" autoComplete="new-password" minLength={6} hint="Use at least 6 characters." required value={password} onChange={event => setPassword(event.target.value)} disabled={isLoading} />
      </div>
      <AsyncButton type="submit" loading={isLoading} loadingLabel="Creating account…" className="mt-6 h-12 w-full rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">Create account</AsyncButton>
    </form>
  </AuthPage>;
}
