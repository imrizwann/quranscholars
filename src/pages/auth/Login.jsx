import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import userAuthApi, {
  useLoginMutation,
} from "@/services/api/user/userAuthApis.js";
import { setUser } from "@/store/slices/userSlice.js";
import { loginDestination } from "@/components/guards/loginDestination.js";
import { userMessage } from "@/lib/user-messages.js";
import AuthPage from "@/features/auth/components/AuthPage.jsx";
import AuthInput from "@/features/auth/components/AuthInput.jsx";
import GoogleSignIn from "@/features/auth/components/GoogleSignIn.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pending = useRef(false);
  const [login] = useLoginMutation();
  const dispatch = useDispatch(),
    navigate = useNavigate(),
    location = useLocation();
  const returnTo =
    typeof location.state?.from === "string" ? location.state.from : undefined;

  async function submit(event) {
    event.preventDefault();
    if (pending.current || isLoading) return;
    if (!email.trim() || !password) {
      setError("Enter your email and password to sign in.");
      return;
    }
    pending.current = true;
    setIsLoading(true);
    setError("");
    try {
      const user = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();
      if (
        !user?._id ||
        !["user", "instructor", "admin"].includes(user.role) ||
        !Number.isFinite(user.expires)
      )
        throw new Error("Invalid sign-in response");
      // Replace a cached anonymous session before mounting an authenticated guard.
      await dispatch(userAuthApi.util.upsertQueryData("me", undefined, user));
      dispatch(setUser(user));
      navigate(loginDestination(user, returnTo), { replace: true });
    } catch (failure) {
      setError(
        userMessage(failure, "We could not sign you in. Please try again."),
      );
    } finally {
      pending.current = false;
      setIsLoading(false);
    }
  }

  return (
    <AuthPage
      illustration={{
        src: "/images/auth/learning-with-laptop.svg",
        // Plain illustration beside the form (no brand panel).
        plain: true,
        title: "Make time for learning.",
        description: "Pick up where you left off, one lesson at a time.",
        source: "https://www.vecteezy.com/vector-art/10595807-young-muslim-woman-in-hijab-working-on-laptop-while-writing-plan-vector-illustration-free-download",
      }}
      title="Sign in"
      description="Continue your courses or open your teaching workspace."
      footer={
        <>
          New to DarsLearn?{" "}
          <Link
            to="/register"
            state={returnTo ? { from: returnTo } : undefined}
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {location.state?.registrationComplete === true && !error && (
        <p
          role="status"
          className="mb-5 flex items-start gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Your account has been created. Sign in to continue.
        </p>
      )}
      {location.state?.verificationEmailSent === true && (
        <p
          role="status"
          className="mb-5 text-sm leading-6 text-muted-foreground"
        >
          We’ve also sent a verification link to your email. Please check your
          inbox.
        </p>
      )}
      {error && (
        <p
          id="login-error"
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <GoogleSignIn disabled={isLoading} onBusyChange={setIsLoading} returnTo={returnTo} />
      <form
        onSubmit={submit}
        aria-label="Sign in"
        aria-busy={isLoading || undefined}
        aria-describedby={error ? "login-error" : undefined}
      >
        <div className="space-y-5">
          <AuthInput
            id="login-email"
            name="email"
            label="Email address"
            placeholder="you@example.com"
            type="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
          />
          <AuthInput
            id="login-password"
            name="password"
            label="Password"
            labelAction={<Link to="/forgot-password">Forgot password?</Link>}
            placeholder="Enter your password"
            type="password"
            autoComplete="current-password"
            maxLength={1024}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
          />
        </div>
        <AsyncButton
          type="submit"
          loading={isLoading}
          loadingLabel="Signing in…"
          className="auth-submit"
        >
          Sign in
        </AsyncButton>
      </form>
    </AuthPage>
  );
}
