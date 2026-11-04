import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import userAuthApi, { useLoginMutation } from "@/services/api/user/userAuthApis.js";
import { setUser } from "@/store/slices/userSlice.js";
import { loginDestination } from "@/components/guards/loginDestination.js";
import { userMessage } from "@/lib/user-messages.js";
import AuthPage from "@/features/auth/components/AuthPage.jsx";
import AuthInput from "@/features/auth/components/AuthInput.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pending = useRef(false);
  const [login] = useLoginMutation();
  const dispatch = useDispatch(), navigate = useNavigate(), location = useLocation();
  const returnTo = typeof location.state?.from === "string" ? location.state.from : undefined;

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    if (!email.trim() || !password) { setError("Enter your email and password to sign in."); return; }
    pending.current = true; setIsLoading(true); setError("");
    try {
      const user = await login({ email: email.trim().toLowerCase(), password }).unwrap();
      if (!user?._id || !["user", "instructor", "admin"].includes(user.role) || !Number.isFinite(user.expires)) throw new Error("Invalid sign-in response");
      // Replace a cached anonymous session before mounting an authenticated guard.
      await dispatch(userAuthApi.util.upsertQueryData("me", undefined, user));
      dispatch(setUser(user));
      navigate(loginDestination(user, returnTo), { replace: true });
    } catch (failure) { setError(userMessage(failure, "We could not sign you in. Please try again.")); }
    finally { pending.current = false; setIsLoading(false); }
  }

  return <AuthPage title="Sign in" description="Continue your courses or open your teaching workspace." footer={<>New to QuranScholar? <Link to="/register" state={returnTo ? { from: returnTo } : undefined} className="font-semibold text-primary hover:underline">Create an account</Link></>}>
    {location.state?.registrationComplete === true && !error && <p role="status" className="mb-5 flex items-start gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Your account has been created. Sign in to continue.</p>}
    {error && <p id="login-error" role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
    <form onSubmit={submit} aria-label="Sign in" aria-busy={isLoading || undefined} aria-describedby={error ? "login-error" : undefined}>
      <div className="space-y-5">
        <AuthInput id="login-email" name="email" label="Email address" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} disabled={isLoading} />
        <AuthInput id="login-password" name="password" label="Password" type="password" autoComplete="current-password" maxLength={1024} required value={password} onChange={event => setPassword(event.target.value)} disabled={isLoading} />
      </div>
      <AsyncButton type="submit" loading={isLoading} loadingLabel="Signing in…" className="mt-6 h-12 w-full rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">Sign in</AsyncButton>
    </form>
  </AuthPage>;
}
