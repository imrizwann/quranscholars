import "./table-scroll.css";

// Keep column relationships intact on small screens and support keyboard scrolling.
export default function TableScroll({ label, children, className = "" }) {
  return <div className={`qs-table-scroll ${className}`} role="region" aria-label={label} tabIndex={0}>{children}</div>;
}
