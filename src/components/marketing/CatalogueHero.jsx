import "./catalogue-hero.css";

export default function CatalogueHero({ id, eyebrow, title, description, icon: Icon, highlights = [], children }) {
  return <section className="catalogue-hero" aria-labelledby={id}>
    <div className="catalogue-hero-inner">
      <header>
        <p className="catalogue-eyebrow">{Icon && <Icon size={16} aria-hidden="true" />}{eyebrow}</p>
        <h1 id={id}>{title}</h1>
        <p className="catalogue-description">{description}</p>
        {highlights.length > 0 && <ul className="catalogue-highlights" aria-label="Learning format">{highlights.map(item => <li key={item}>{item}</li>)}</ul>}
      </header>
      {children && <div className="catalogue-hero-actions">{children}</div>}
    </div>
  </section>;
}
