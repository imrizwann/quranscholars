import { Toaster } from "sonner";
import { CheckCircle2, CircleAlert, Info, Loader2, X } from "lucide-react";
import "./toasts.css";

export default function AppToaster() {
  return <Toaster position="bottom-right" visibleToasts={3} closeButton duration={5000} gap={10}
    offset={20} mobileOffset={{ bottom: "max(16px, env(safe-area-inset-bottom))", left: 12, right: 12 }}
    containerAriaLabel="Action updates" className="qs-toaster"
    toastOptions={{ className: "qs-toast", closeButtonAriaLabel: "Dismiss update", classNames: { title: "qs-toast-title", description: "qs-toast-description", closeButton: "qs-toast-close" } }}
    icons={{ success: <CheckCircle2 size={20} aria-hidden="true" />, error: <CircleAlert size={20} aria-hidden="true" />, info: <Info size={20} aria-hidden="true" />, loading: <Loader2 size={20} className="animate-spin" aria-hidden="true" />, close: <X size={14} aria-hidden="true" /> }} />;
}
