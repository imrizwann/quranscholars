const Spinner = ({ size = 24, className = "", label = "Loading", decorative = false }) => (
  <span className={`qs-spinner inline-flex shrink-0 ${className}`} style={{ width: size, height: size }} role={decorative ? undefined : "status"} aria-label={decorative ? undefined : label} aria-hidden={decorative ? "true" : undefined}>
    <svg viewBox="0 0 40 40" fill="none" className="size-full" aria-hidden="true">
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" opacity=".16" />
      <circle className="qs-spinner-ring" cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="30 71" />
    </svg>
  </span>
);

export default Spinner;
