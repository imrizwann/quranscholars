import { useId } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthPage({ title, description, children, footer, illustration }) {
  const titleId = useId();
  return <main className="auth-page bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
    <div className={`auth-page-content mx-auto w-full${illustration ? " auth-page-content--illustrated" : ""}`}>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"><ArrowLeft className="size-4" aria-hidden="true" />Back to website</Link>
      <div className={illustration ? `auth-layout${illustration.position === "right" ? " auth-layout--illustration-right" : ""}` : undefined}>
      {illustration && <aside className="auth-illustration">
        <div className="auth-illustration-copy"><h2>{illustration.title}</h2><p>{illustration.description}</p></div>
        <img src={illustration.src} alt="" width="2000" height="2000" decoding="async" />
        <a className="auth-illustration-credit" href={illustration.source} target="_blank" rel="noopener noreferrer">Illustration by Angga Afin on Vecteezy</a>
      </aside>}
      <div className="auth-form-column">
      <section aria-labelledby={titleId} className="auth-panel">
        <header className="mb-6"><h1 id={titleId} className="text-3xl font-bold tracking-tight text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></header>
        {children}
        <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div>
      </section>
      <p className="mt-5 text-center text-sm text-muted-foreground">Need help? <Link to="/contact" className="font-semibold text-primary hover:underline">Contact the team</Link></p>
      </div>
      </div>
    </div>
  </main>;
}
