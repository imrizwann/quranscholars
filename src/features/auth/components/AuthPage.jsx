import { useId } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

export default function AuthPage({ title, description, children, footer, illustration }) {
  const titleId = useId();
  return <main className="auth-page bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
    <div className={`auth-page-content mx-auto w-full${illustration ? " auth-page-content--illustrated" : ""}`}>
      <div className={illustration ? `auth-layout${illustration.position === "right" ? " auth-layout--illustration-right" : ""}` : undefined}>
      {illustration && <aside className={`auth-illustration${illustration.plain ? " auth-illustration--plain" : ""}`}>
        <span className="auth-illustration-pattern" aria-hidden="true" />
        <div className="auth-illustration-copy">
          <h2>{illustration.title}</h2>
          <p>{illustration.description}</p>
          {illustration.points?.length > 0 && <ul className="auth-illustration-points">
            {illustration.points.map(point => <li key={point}><span aria-hidden="true"><Check size={12} strokeWidth={3} /></span>{point}</li>)}
          </ul>}
        </div>
        <div className="auth-illustration-art">
          <img src={illustration.src} alt="" width="2000" height="2000" decoding="async" className={illustration.mirrored ? "auth-illustration-mirrored" : undefined} />
        </div>
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
