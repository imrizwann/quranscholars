import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { ArrowRight, BookOpen, ChevronDown, Compass, Headphones, Info, LayoutDashboard, LogOut, Mail, Menu as MenuIcon, NotebookPen, Presentation, Search, ShieldCheck, UserRound, Video, X } from "lucide-react";
import Brand from "@/components/branding/Brand.jsx";
import useSignOut from "@/features/auth/useSignOut.js";
import useProfilePhoto from "@/features/profile/useProfilePhoto.js";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import NotificationBell from "@/realtime/NotificationBell.jsx";
import "./navbar.css";

const primaryLinks = [
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/live-classes", label: "Live classes", icon: Video },
];
const moreLinks = [
  { to: "/blogs", label: "Resources", icon: NotebookPen },
  { to: "/services", label: "Learner services", icon: Headphones },
  { to: "/about", label: "About QuranScholar", icon: Info },
  { to: "/mission", label: "Our mission", icon: Compass },
  { to: "/contact", label: "Contact", icon: Mail },
];

function accountLinks(user) {
  return [
    { to: "/dashboard/learning", label: "My learning", icon: BookOpen },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/profile", label: "My profile", icon: UserRound },
    ...(user.role === "instructor" ? [{ to: "/instructor/dashboard", label: "Instructor dashboard", icon: Presentation }] : []),
    ...(user.role === "admin" ? [{ to: "/admin/instructor-applications", label: "Admin dashboard", icon: ShieldCheck }] : []),
  ];
}

function MenuLinks({ links }) {
  return links.map(({ to, label, icon: Icon }) => <Menu.Item key={to} render={<NavLink to={to} end={to === "/dashboard"} />} className="navbar-menu-item"><Icon size={17} aria-hidden="true" /><span>{label}</span></Menu.Item>);
}

export default function Navbar() {
  const user = useSelector(state => state.user.user);
  const { data: photo } = useProfilePhoto();
  const { signOut, isSigningOut } = useSignOut();
  const [openPopup, setOpenPopup] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInput = useRef(null);
  const searchForm = useRef(null);
  const searchTrigger = useRef(null);
  const mobileClose = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const name = user?.name?.trim() || "Your account";
  const role = user?.role === "admin" ? "Administrator" : user?.role === "instructor" ? "Instructor" : "Learner";
  const photoUrl = photo?.smallUrl || photo?.url;
  const links = user ? accountLinks(user) : [];
  const moreActive = moreLinks.some(link => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`));
  const searchOpen = openPopup === "search";

  useEffect(() => {
    setOpenPopup(null);
    setMobileOpen(false);
  }, [location.key, user?._id, user?.role]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeMenus = () => { setOpenPopup(null); setMobileOpen(false); };
    desktop.addEventListener("change", closeMenus);
    return () => desktop.removeEventListener("change", closeMenus);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    searchInput.current?.focus({ preventScroll: true });
    const dismiss = event => {
      if (!searchForm.current?.contains(event.target)) {
        setOpenPopup(current => current === "search" ? null : current);
      }
    };
    const escape = event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenPopup(current => current === "search" ? null : current);
      searchTrigger.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [searchOpen]);

  const changePopup = name => open => {
    setOpenPopup(current => open ? name : current === name ? null : current);
    if (open) setMobileOpen(false);
  };
  const changeMobile = open => {
    setMobileOpen(open);
    if (open) setOpenPopup(null);
  };
  const searchCourses = event => {
    event.preventDefault();
    const query = search.trim();
    if (!query) { searchInput.current?.focus(); return; }
    navigate(`/courses?search=${encodeURIComponent(query)}`);
    setSearch(""); setOpenPopup(null); setMobileOpen(false);
  };
  const logout = async () => {
    if (await signOut()) { setOpenPopup(null); setMobileOpen(false); }
  };

  return <Dialog.Root open={mobileOpen} onOpenChange={changeMobile}>
    <header className="navbar-shell">
      <nav className="navbar-inner" aria-label="Main navigation" data-search-open={searchOpen || undefined}>
        <Link className="navbar-logo" to="/" aria-label="QuranScholar home"><Brand /></Link>
        <div className="navbar-primary">
          {primaryLinks.map(({ to, label }) => <NavLink key={to} to={to} className="navbar-link">{label}</NavLink>)}
          <Menu.Root open={openPopup === "more"} onOpenChange={changePopup("more")} modal={false}>
            <Menu.Trigger id="navbar-more-trigger" className={`navbar-link navbar-more-trigger${moreActive ? " is-active" : ""}`}>More<ChevronDown size={14} aria-hidden="true" /></Menu.Trigger>
            <Menu.Portal><Menu.Positioner align="end" sideOffset={10} collisionPadding={12} className="navbar-positioner"><Menu.Popup className="navbar-popup qs-popup-motion" aria-label="More pages"><MenuLinks links={moreLinks} /></Menu.Popup></Menu.Positioner></Menu.Portal>
          </Menu.Root>
        </div>
        <div className="navbar-actions">
          <form ref={searchForm} className="navbar-search-form" data-open={searchOpen || undefined} onSubmit={searchCourses} onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpenPopup(current => current === "search" ? null : current);
          }} role="search" aria-label="Course search">
            <label className="sr-only" htmlFor="navbar-course-search">Course title, subject, or keyword</label>
            <input ref={searchInput} id="navbar-course-search" type="search" autoComplete="off" enterKeyHint="search" maxLength={100} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search courses or subjects" disabled={!searchOpen} tabIndex={searchOpen ? 0 : -1} aria-hidden={!searchOpen} />
            <button ref={searchTrigger} type="button" className="navbar-icon-button" aria-label={searchOpen ? "Close course search" : "Search courses"} aria-expanded={searchOpen} aria-controls="navbar-course-search" onClick={() => { setOpenPopup(current => current === "search" ? null : "search"); setMobileOpen(false); }}>{searchOpen ? <X size={20} aria-hidden="true" /> : <Search size={20} aria-hidden="true" />}</button>
          </form>
          {user ? <>
            <NotificationBell />
            <Menu.Root open={openPopup === "profile"} onOpenChange={changePopup("profile")} modal={false}>
              <Menu.Trigger id="navbar-profile-trigger" className="navbar-avatar-button" aria-label={`Profile menu for ${name}`}><ProfileAvatar src={photoUrl} name={user.name} /></Menu.Trigger>
              <Menu.Portal><Menu.Positioner align="end" sideOffset={10} collisionPadding={12} className="navbar-positioner"><Menu.Popup id="navbar-profile-menu" className="navbar-popup navbar-profile-popup qs-popup-motion" aria-label="Profile">
                <div className="navbar-profile-summary"><span>{role}</span><strong>{name}</strong>{user.email && <p>{user.email}</p>}</div>
                <MenuLinks links={links} />
                <Menu.Separator className="navbar-divider" />
                <Menu.Item className="navbar-menu-item navbar-signout" closeOnClick={false} disabled={isSigningOut} onClick={logout}><LogOut size={17} aria-hidden="true" /><span>{isSigningOut ? "Signing out..." : "Log out"}</span></Menu.Item>
              </Menu.Popup></Menu.Positioner></Menu.Portal>
            </Menu.Root>
          </> : <div className="navbar-auth-links"><Link to="/login" className="navbar-login">Log in</Link><Link to="/get-started" className="cw-button cw-primary">Get started</Link></div>}
          <Dialog.Trigger id="navbar-mobile-trigger" className="navbar-icon-button navbar-mobile-trigger" aria-label="Open navigation menu"><MenuIcon size={21} aria-hidden="true" /></Dialog.Trigger>
        </div>
      </nav>
    </header>
    <Dialog.Portal>
      <Dialog.Backdrop className="navbar-mobile-backdrop qs-backdrop-motion" />
      <Dialog.Popup id="mobile-navigation-drawer" className="navbar-mobile-drawer" initialFocus={mobileClose}>
        <div className="navbar-mobile-heading"><Dialog.Title>Navigation</Dialog.Title><Dialog.Close ref={mobileClose} className="navbar-icon-button" aria-label="Close navigation menu"><X size={20} aria-hidden="true" /></Dialog.Close></div>
        <div className="navbar-mobile-scroll">
          <nav aria-label="Mobile navigation">
            <div className="navbar-mobile-links">{primaryLinks.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className="navbar-mobile-link" onClick={() => setMobileOpen(false)}><Icon size={19} aria-hidden="true" />{label}</NavLink>)}</div>
            <p className="navbar-group-label">Discover</p>
            <div className="navbar-mobile-links">{moreLinks.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className="navbar-mobile-link" onClick={() => setMobileOpen(false)}><Icon size={19} aria-hidden="true" />{label}</NavLink>)}</div>
          </nav>
          <div className="navbar-mobile-account">
            {user ? <>
              <div className="navbar-mobile-identity"><ProfileAvatar src={photoUrl} name={user.name} size={40} /><div><strong>{name}</strong><span>{role}</span></div></div>
              {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/dashboard"} className="navbar-mobile-link" onClick={() => setMobileOpen(false)}><Icon size={18} aria-hidden="true" />{label}</NavLink>)}
              <button type="button" className="navbar-mobile-link navbar-signout" disabled={isSigningOut} onClick={logout}><LogOut size={18} aria-hidden="true" />{isSigningOut ? "Signing out..." : "Log out"}</button>
            </> : <div className="navbar-mobile-auth"><Link to="/get-started" className="cw-button cw-primary" onClick={() => setMobileOpen(false)}>Get started<ArrowRight size={16} aria-hidden="true" /></Link><Link to="/login" className="cw-button" onClick={() => setMobileOpen(false)}>Log in</Link></div>}
          </div>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
