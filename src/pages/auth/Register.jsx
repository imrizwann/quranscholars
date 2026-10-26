import { userMessage } from "@/lib/user-messages.js";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

import { useRegisterMutation } from "@/services/api/user/userAuthApis.js";

const onboardingSteps = [
  {
    icon: UserPlus,
    label: "Create profile",
    value: "Parent or student account",
  },
  {
    icon: FileCheck2,
    label: "Submit admission",
    value: "Share goals and course needs",
  },
  {
    icon: GraduationCap,
    label: "Start learning",
    value: "Join your assigned class",
  },
];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [register] = useRegisterMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isRedirecting) return undefined;

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      navigate("/login");
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isRedirecting, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isRedirecting) return;

    setIsLoading(true);
    try {
      await register({ name, email, password }).unwrap();
      setSuccess("Your account has been created. You can now sign in.");
      setError("");
      setRedirectCountdown(3);
      setIsRedirecting(true);
    } catch (error) {
      setError(userMessage(error, "We could not create your account. Please try again."));
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  const redirectProgress = `${Math.min(
    100,
    ((3 - redirectCountdown) / 3) * 100,
  )}%`;

  return (
    <main className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid grid-cols-1 min-h-[calc(100vh-8rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-surface shadow-card lg:grid-cols-[0.94fr_1.06fr]">
        <section className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-8">
          <form onSubmit={handleRegister} className="w-full min-w-0 max-w-md">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <UserPlus className="size-3.5" />
                Create your learning profile
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                Join Quran Scholars
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Open your student portal and begin the admission journey.
              </p>
            </div>

            {error && (
              <div role="alert" className="mt-6 rounded-lg border border-[color-mix(in_srgb,var(--destructive)_24%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] px-4 py-3">
                <p className="flex items-start gap-2 text-sm font-medium text-[var(--destructive)]">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div role="status" className="mt-6 rounded-lg border border-success/20 bg-success/10 px-4 py-3">
                <p className="flex items-start gap-2 text-sm font-medium text-success">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  {success}
                </p>
                {isRedirecting && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Redirecting to login</span>
                      <span>{redirectCountdown}s</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-success/15">
                      <div
                        className="h-full rounded-full bg-success transition-all duration-500"
                        style={{ width: redirectProgress }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-7 space-y-5">
              <div>
                <label htmlFor="register-name" className="text-sm font-semibold text-foreground">
                  Full name
                </label>
                <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-input bg-background px-3 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    id="register-name"
                    autoComplete="name"
                    type="text"
                    placeholder="e.g. Aisha Siddiqui"
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isRedirecting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-input bg-background px-3 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    id="register-email"
                    autoComplete="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isRedirecting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-password" className="text-sm font-semibold text-foreground">
                  Password
                </label>
                <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-input bg-background px-3 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                  <Lock className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    id="register-password"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isRedirecting}
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isRedirecting}
                    className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Use 8+ characters with a mix of letters and numbers.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isRedirecting}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-card transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : isRedirecting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  <span>Create account</span>
                </>
              )}
            </button>

            <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Already registered?</span>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 font-bold text-primary transition hover:text-accent-foreground"
              >
                <span>Sign in</span>
                <ArrowRight className="size-4" />
              </Link>
            </p>
          </form>
        </section>

        <section className="relative hidden bg-secondary p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-sm font-semibold text-foreground"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-card">
                <BookOpen className="size-5" />
              </span>
              Quran Scholars LMS
            </Link>

            <div className="mt-14 max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-accent-foreground">
                <ShieldCheck className="size-3.5" />
                Guided onboarding
              </p>
              <h2 className="mt-5 max-w-lg text-4xl font-bold leading-tight tracking-tight text-foreground">
                A focused start for every learner and family.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                Create your account once, then manage admissions, course access,
                and learning progress through the portal.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {onboardingSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-card"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
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
      </div>
    </main>
  );
};

export default Register;
