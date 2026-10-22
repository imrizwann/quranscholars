import "./collapsible-sidebar.css";

export function HamburgerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>;
}

export function SidebarToggle({ collapsed, onToggle, controls, className = "" }) {
  const label = collapsed ? "Expand navigation" : "Collapse navigation";
  return <button type="button" className={`sidebar-toggle ${className}`}
    onClick={onToggle} aria-expanded={!collapsed} aria-controls={controls}
    aria-label={label} title={label}><HamburgerIcon /></button>;
}

/** Set --sidebar-expanded-width and --sidebar-collapsed-width on the host. */
export default function CollapsibleSidebar({ collapsed, id, children, className = "" }) {
  return <aside id={id} className={`collapsible-sidebar ${className}`} data-collapsed={collapsed}>{children}</aside>;
}
