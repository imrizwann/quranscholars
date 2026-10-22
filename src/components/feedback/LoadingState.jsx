import Spinner from "./Spinner.jsx";

export default function LoadingState({ label = "Loading...", variant = "content", className = "" }) {
  const Tag = variant === "inline" ? "span" : "div";
  const layout = variant === "inline" ? "inline-flex items-center gap-2" : `flex flex-col items-center justify-center gap-3 px-4 ${variant === "page" ? "min-h-[60vh]" : "min-h-32 py-6"}`;
  // Container units scale the ring to its content area, including narrow side panels.
  const size = variant === "inline" ? 16 : variant === "page" ? "clamp(32px, 6cqw, 48px)" : "clamp(24px, 8cqw, 36px)";
  return (
    <Tag className={`${layout} text-primary ${className}`} style={variant === "inline" ? undefined : { containerType: "inline-size" }} role="status" aria-live="polite" aria-atomic="true" data-route-loading={variant === "page" ? "true" : undefined}>
      <Spinner size={size} decorative />
      <span className="text-sm font-semibold">{label}</span>
    </Tag>
  );
}
