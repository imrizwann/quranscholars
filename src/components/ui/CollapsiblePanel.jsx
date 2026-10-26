import { useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import "./collapsible-panel.css";

/** Keeps children mounted so collapsing never discards form or upload state. */
export default function CollapsiblePanel({
  as: Container = "section",
  label,
  heading,
  actions,
  children,
  className = "",
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const content = useRef(null);
  const reducedMotion = useReducedMotion();

  function toggle() {
    if (open) {
      // Hidden previews must not keep playing; uploads stay mounted and running.
      content.current
        ?.querySelectorAll("video, audio")
        .forEach((media) => media.pause());
    }
    setOpen((value) => !value);
  }

  return (
    <Container className={`collapsible-panel ${className}`} data-open={open}>
      <div className="collapsible-panel-header">
        <div className="collapsible-panel-heading">{heading}</div>
        <div className="collapsible-panel-actions">
          {actions}
          <button
            type="button"
            className="collapsible-panel-toggle"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={`${id}-content`}
            aria-label={`${open ? "Collapse" : "Expand"} ${label}`}
            title={`${open ? "Collapse" : "Expand"} ${label}`}
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <motion.div
        id={`${id}-content`}
        ref={content}
        className="collapsible-panel-content"
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.32,
          ease: [0.22, 1, 0.36, 1],
        }}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="collapsible-panel-inner">{children}</div>
      </motion.div>
    </Container>
  );
}
