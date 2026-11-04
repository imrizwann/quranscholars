import { useId } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthPage({ title, description, children, footer }) {
  const titleId = useId();
  return <main className="bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
    <div className="mx-auto w-full max-w-md">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"><ArrowLeft className="size-4" aria-hidden="true" />Back to website</Link>
      <section aria-labelledby={titleId} className="rounded-lg border border-border bg-surface p-5 sm:p-8">
        <header className="mb-6"><h1 id={titleId} className="text-3xl font-bold tracking-tight text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></header>
        {children}
        <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div>
      </section>
      <p className="mt-5 text-center text-sm text-muted-foreground">Need help? <Link to="/contact" className="font-semibold text-primary hover:underline">Contact the team</Link></p>
    </div>
  </main>;
}
