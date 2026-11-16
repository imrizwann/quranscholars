import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./marketing-hero.css";

const HighlightGrid = ({ highlights }) => (
  <dl className="public-highlights" aria-label="At a glance">
    {highlights.map(({ label, value, icon: Icon }) => <div key={label}><dt>{Icon && <Icon size={19} aria-hidden="true" />}{label}</dt><dd>{value}</dd></div>)}
  </dl>
);

function HeroAction({ action, primary = false }) {
  const className = `cw-button${primary ? " cw-primary" : ""}`;
  const content = <>{action.label}{primary && <ArrowRight size={17} aria-hidden="true" />}</>;
  return action.href ? <a href={action.href} className={className}>{content}</a> : <Link to={action.to} className={className}>{content}</Link>;
}

export default function MarketingHero({ eyebrow, title, description, icon: Icon, primaryAction, secondaryAction, highlights = [], highlightsTitle, tone = "light", children, labelledBy = "marketing-hero-title" }) {
  const hasAside = children || highlights.length > 0;
  return <section className={`public-hero${tone === "dark" ? " public-hero--dark" : ""}`} aria-labelledby={labelledBy}>
    <div className="public-page">
      <div className={hasAside ? "public-hero-grid" : ""}>
        <header className="public-heading !mb-0">
          <p className="public-eyebrow">{Icon && <Icon size={16} aria-hidden="true" />}{eyebrow}</p>
          <h1 id={labelledBy}>{title}</h1>
          <p>{description}</p>
          {(primaryAction || secondaryAction) && <div className="public-actions">
            {primaryAction && <HeroAction action={primaryAction} primary />}
            {secondaryAction && <HeroAction action={secondaryAction} />}
          </div>}
        </header>
        {children || (highlights.length > 0 && (tone === "dark" ? <aside className="public-hero-aside" aria-label={highlightsTitle || "At a glance"}>{highlightsTitle && <h2>{highlightsTitle}</h2>}<HighlightGrid highlights={highlights} /></aside> : <HighlightGrid highlights={highlights} />))}
      </div>
    </div>
  </section>;
}
