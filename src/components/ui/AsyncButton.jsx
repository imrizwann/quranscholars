import Spinner from "@/components/feedback/Spinner.jsx";

export default function AsyncButton({ loading = false, loadingLabel, disabled, children, className = "", type = "button", ...props }) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`inline-flex items-center justify-center gap-2 ${className}`}>
    {loading && <Spinner size={16} decorative />}
    <span className="inline-flex items-center justify-center gap-2" aria-live="polite">{loading && loadingLabel ? loadingLabel : children}</span>
  </button>;
}
