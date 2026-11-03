import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HighlightGrid = ({ highlights }) => (
  <dl className="public-highlights" aria-label="At a glance">
    {highlights.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
  </dl>
);

export default function MarketingHero({ eyebrow, title, description, icon: Icon, primaryAction, secondaryAction, highlights = [], children, labelledBy = "marketing-hero-title" }) {
  const hasAside = children || highlights.length > 0;
  return <section className="public-hero" aria-labelledby={labelledBy}>
    <div className="public-page">
      <div className={hasAside ? "public-hero-grid" : ""}>
        <header className="public-heading !mb-0">
          <p className="public-eyebrow">{Icon && <Icon size={16} aria-hidden="true" />}{eyebrow}</p>
          <h1 id={labelledBy}>{title}</h1>
          <p>{description}</p>
          {(primaryAction || secondaryAction) && <div className="public-actions">
            {primaryAction && <Link to={primaryAction.to} className="cw-button cw-primary">{primaryAction.label}<ArrowRight size={16} aria-hidden="true" /></Link>}
            {secondaryAction && <Link to={secondaryAction.to} className="cw-button">{secondaryAction.label}</Link>}
          </div>}
        </header>
        {children || (highlights.length > 0 && <HighlightGrid highlights={highlights} />)}
      </div>
    </div>
  </section>;
}
