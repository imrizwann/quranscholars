import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import CollapsibleSidebar, { HamburgerIcon, SidebarToggle } from "@/components/navigation/CollapsibleSidebar.jsx";
import { useSelector } from "react-redux";
import { ArrowUpRight, BarChart3, BookOpen, ChevronRight, CircleDollarSign, ClipboardCheck, GraduationCap, LayoutDashboard, Library, MessageSquareText, Radio, Settings, UserRound, Users, X } from "lucide-react";
import "./workspace.css";

const studentLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/learning", label: "My learning", icon: BookOpen },
  { to: "/dashboard/assignments", label: "Assignments", icon: ClipboardCheck },
  { to: "/dashboard/wishlist", label: "Wishlist", icon: Library },
  { to: "/dashboard/purchases", label: "Purchases", icon: CircleDollarSign },
];
const instructorLinks = [
  { to: "/instructor/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/instructor/courses", label: "Courses", icon: BookOpen },
  { to: "/instructor/live-classes", label: "Live classes", icon: Radio },
  { to: "/instructor/students", label: "Students", icon: Users },
  { to: "/instructor/assignments", label: "Assignments", icon: ClipboardCheck },
  { to: "/instructor/resources", label: "Resources", icon: Library },
  { to: "/instructor/earnings", label: "Earnings", icon: CircleDollarSign },
  { to: "/instructor/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/instructor/reviews", label: "Reviews", icon: MessageSquareText },
];

const adminLinks = [{ to: "/admin/admissions", label: "Admissions", icon: ClipboardCheck }];

function WorkspaceSidebar({ instructor, admin, onNavigate, mobile = false, collapsed = false }) {
  const base = instructor ? "/instructor" : "/dashboard";
  const { pathname } = useLocation();
  const links = admin ? adminLinks : instructor ? instructorLinks : studentLinks;
  const role = admin ? "Admin" : instructor ? "Instructor" : "Learner";
  const renderLink = ({ icon: Icon, ...link }) => (
    <NavLink key={link.to} {...link} onClick={onNavigate} aria-label={link.label} title={collapsed ? link.label : undefined}
      className={({ isActive }) => `workspace-nav-link${isActive || (instructor && pathname === "/instructor" && link.label === "Overview") ? " is-active" : ""}`}>
      <Icon size={18} aria-hidden="true" /><span>{link.label}</span>
    </NavLink>
  );
  return (
    <div className="workspace-sidebar">
      <div className="workspace-brand-row">
        <NavLink to="/" className="workspace-brand" onClick={onNavigate} aria-label="QuranScholar home" title={collapsed ? "QuranScholar home" : undefined}>
          <span className="workspace-brand-icon"><BookOpen size={21} aria-hidden="true" /></span>
          <span className="workspace-brand-copy">QuranScholar<span className="workspace-brand-caption">A journey of knowledge</span></span>
        </NavLink>
        {mobile && <button className="workspace-icon-button" aria-label="Close navigation" onClick={onNavigate}><X size={20} /></button>}
      </div>
      <div className="workspace-role" title={collapsed ? `${role} workspace` : undefined}><GraduationCap size={17} aria-hidden="true" /><span>{role} workspace</span></div>
      <nav aria-label={`${role} navigation`} className="workspace-navigation">
        <p className="workspace-nav-caption">{admin ? "Administration" : instructor ? "Teaching" : "Your learning"}</p>
        {links.map(renderLink)}
        <p className="workspace-nav-caption workspace-account-caption">Account</p>
        {(admin ? [{ to: "/profile", label: "Profile", icon: UserRound }] : [
          { to: `${base}/profile`, label: instructor ? "Public profile" : "Profile", icon: UserRound },
          { to: `${base}/settings`, label: "Settings", icon: Settings },
        ]).map(renderLink)}
      </nav>
      <div className="workspace-sidebar-footer">
        <p>Learn with purpose.<br />Grow with every lesson.</p>
        <NavLink to="/" onClick={onNavigate} aria-label="Back to website" title={collapsed ? "Back to website" : undefined}><span>Back to website</span><ArrowUpRight size={16} aria-hidden="true" /></NavLink>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({ type = "student" }) {
  const instructor = type === "instructor";
  const admin = type === "admin";
  const role = admin ? "Admin" : instructor ? "Instructor" : "Learner";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSelector((state) => state.user.user);
  const name = user?.name?.trim() || role;
  const initials = name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("");
  const dialog = useRef(null);
  const { pathname } = useLocation();
  const base = instructor ? "/instructor" : "/dashboard";
  const closeNavigation = () => dialog.current?.close();
  const activeLink = [...(admin ? adminLinks : instructor ? instructorLinks : studentLinks),
    { to: `${base}/profile`, label: "Profile" }, { to: `${base}/settings`, label: "Settings" },
  ].find((link) => link.end ? pathname === link.to : pathname.startsWith(link.to));

  useEffect(() => {
    closeNavigation();
  }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) closeNavigation(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="workspace-shell">
      <a href="#workspace-content" className="workspace-skip-link">Skip to content</a>
      <CollapsibleSidebar id="workspace-desktop-navigation" className="workspace-desktop-sidebar" collapsed={collapsed}>
        <WorkspaceSidebar instructor={instructor} admin={admin} collapsed={collapsed} />
      </CollapsibleSidebar>
      <dialog ref={dialog} id="workspace-mobile-navigation" className="workspace-mobile-drawer" aria-label="Workspace navigation" onClose={() => setMobileOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) closeNavigation(); }}>
        <WorkspaceSidebar instructor={instructor} admin={admin} mobile onNavigate={closeNavigation} />
      </dialog>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb">
            <SidebarToggle className="workspace-desktop-toggle" collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} controls="workspace-desktop-navigation" />
            <button type="button" className="workspace-icon-button workspace-menu-button" onClick={() => { dialog.current?.showModal(); setMobileOpen(true); }} aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls="workspace-mobile-navigation"><HamburgerIcon /></button>
            <span>{admin ? "Admin" : instructor ? "Instructor" : "My workspace"}</span><ChevronRight size={14} aria-hidden="true" />
            <strong>{activeLink?.label || "Overview"}</strong>
          </div>
          <NavLink to={admin ? "/profile" : `${base}/profile`} className="workspace-account" aria-label={`Profile for ${name}`}>
            <span className="workspace-account-name">{name}<small>{role}</small></span>
            <span className="workspace-avatar">{initials}</span>
          </NavLink>
        </header>
        <div id="workspace-content" tabIndex={-1}><Outlet /></div>
      </div>
    </div>
  );
}
