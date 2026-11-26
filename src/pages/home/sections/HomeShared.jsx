import { motion, useReducedMotion } from "framer-motion";
import { easeOut } from "./homeUtils.js";

// Fades content in once as it scrolls into view. Respects reduced-motion settings.
export function Reveal({ as = "div", delay = 0, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: easeOut, delay: reduce ? 0 : delay }}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function SectionIntro({ id, eyebrow, title, children, align = "start", tone = "light" }) {
  return (
    <div className={`home-intro home-intro--${align} home-intro--${tone}`}>
      {eyebrow && <p className="home-eyebrow">{eyebrow}</p>}
      <h2 id={id}>{title}</h2>
      {children && <p className="home-intro-text">{children}</p>}
    </div>
  );
}
