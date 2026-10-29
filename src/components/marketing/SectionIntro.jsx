const SectionIntro = ({ eyebrow, title, description, align = "left", id }) => (
  <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
    {eyebrow && (
      <p className={`public-eyebrow${align === "center" ? " justify-center" : ""}`}>
        {eyebrow}
      </p>
    )}
    <h2
      id={id}
      className="mt-2 text-balance font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
    >
      {title}
    </h2>
    {description && (
      <p className="mt-3 text-pretty text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    )}
  </div>
);

export default SectionIntro;
