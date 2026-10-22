import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";

import userAuthApi, { useLoginMutation } from "@/services/api/user/userAuthApis.js";
import { setUser } from "@/store/slices/userSlice.js";
import { loginDestination } from "@/components/guards/loginDestination.js";

const platformHighlights = [
  {
    icon: GraduationCap,
    label: "Structured pathways",
    value: "Quran, Tajweed, Tafseer",
  },
  { icon: Video, label: "Live learning", value: "Teacher-led online classes" },
  {
    icon: Users,
    label: "Family access",
    value: "Progress support for every student",
  },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [login] = useLoginMutation();
  const dispatch = useDispatch();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!email || !password) {
      setIsLoading(false);
      return setError("Please enter the email and password.");
    }
    try {
      const response = await login({ email, password });
      if (response.data) {
        setSuccess(response.data.message);
        setError("");
        // Replace a cached anonymous session before mounting the instructor guard.
        await dispatch(userAuthApi.util.upsertQueryData("me", undefined, response.data));
        dispatch(setUser(response.data));
        navigate(loginDestination(response.data, location.state?.from), { replace: true });
        setIsLoading(false);
      }
      if (response.error) {
        setError(response.error.data.message);
        setSuccess("");
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      setError("");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-surface shadow-card lg:grid-cols-[1.06fr_0.94fr]">
        <section className="relative hidden bg-secondary p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-sm font-semibold text-foreground"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-card">
                <BookOpenCheck className="size-5" />
              </span>
              Quran Scholars LMS
            </Link>

            <div className="mt-14 max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-accent-foreground">
                <ShieldCheck className="size-3.5" />
                Secure student portal
              </p>
              <h1 className="mt-5 max-w-lg text-4xl font-bold leading-tight tracking-tight text-foreground">
                Continue your Quran learning journey with clarity.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                Access admissions, class updates, learning records, and student
                support from one focused workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {platformHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-card"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <form onSubmit={handleLoginSubmit} className="w-full max-w-md">
            <div>
              <Link
                to="/"
                className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
              >
                <ArrowLeft className="size-4" />
                Back to website
              </Link>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <LogIn className="size-3.5" />
                Welcome back
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                Login to Quran Scholars
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Enter your credentials to open your learning dashboard.
              </p>
            </div>

            {error && (
              <p className="mt-6 flex items-start gap-2 rounded-lg border border-[color-mix(in_srgb,var(--destructive)_24%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] px-4 py-3 text-sm font-medium text-[var(--destructive)]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error.split(",")[0]}
              </p>
            )}

            {success && (
              <p className="mt-6 flex items-start gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {success}
              </p>
            )}

            <div className="mt-7 space-y-5">
              <div>
                <label className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-input bg-background px-3 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <Link
                    to="#"
                    className="text-sm font-semibold text-primary transition hover:text-accent-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-input bg-background px-3 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                  <Lock className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-card transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="size-4" />
                  <span>Login</span>
                </>
              )}
            </button>

            <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>New to Quran Scholars?</span>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 font-bold text-primary transition hover:text-accent-foreground"
              >
                <ArrowLeft className="size-4" />
                <span>Create account</span>
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Login;
