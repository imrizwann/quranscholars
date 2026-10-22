import LoadingState from "@/components/feedback/LoadingState.jsx";
import Logo from "/images/Logo-4.svg";
import { useEffect, useState, useRef } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoMdClose } from "react-icons/io";
import { IoHomeOutline } from "react-icons/io5";
import { FaServicestack } from "react-icons/fa6";
import { MdDashboard, MdSubject } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
  MdOutlineConnectWithoutContact,
  MdOutlineRoundaboutRight,
} from "react-icons/md";
import { CgLogIn } from "react-icons/cg";
import {
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserCircle2,
  ChevronDown,
  Search,
  BookOpen,
  UsersRound,
  Compass,
  ArrowRight,
  LibraryBig,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLogoutMutation } from "@/services/api/user/userAuthApis.js";
import { setUser } from "@/store/slices/userSlice.js";
import { useGetAvatarUrlQuery } from "@/services/api/user/fileUploadApis.js";
import { useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import admissionApis from "@/services/api/user/admissionApis.js";
import { cn } from "@/lib/utils.js";

const desktopNavLinkClass = ({ isActive } = {}) =>
  cn(
    "inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-semibold leading-none text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground active:translate-y-px",
    isActive && "bg-surface-alt text-foreground",
  );

const megaMenuLinkClass = ({ isActive } = {}) =>
  cn(
    "group/link flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold leading-snug text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground",
    isActive && "bg-primary/10 text-primary",
  );

const mobileNavLinkClass = ({ isActive } = {}) =>
  cn(
    "flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem] [&_svg]:shrink-0",
    isActive && "bg-surface-alt text-foreground",
  );

const mobileSubnavLinkClass = ({ isActive } = {}) =>
  cn(
    "block rounded-md px-3 py-2 text-sm font-semibold leading-snug text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground",
    isActive && "bg-surface-alt text-foreground",
  );

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [navbarSearch, setNavbarSearch] = useState("");
  const { user } = useSelector((state) => state.user);
  const isAdmin =
    String(user?.role || "")
      .trim()
      .toLowerCase() === "admin";

  const { data } = useGetAvatarUrlQuery();


  const dispatch = useDispatch();

  const [logout] = useLogoutMutation();

  const mobileMenuRef = useRef();

  const mobileMenuButtonRef = useRef();

  const mobileMenuCloseButtonRef = useRef();

  const userProfileDropdownRef = useRef();

  const dropwdownButtonRef = useRef();

  const exploreButtonRef = useRef();

  const exploreMenuRef = useRef();

  const navigate = useNavigate();

  const location = useLocation();

  const [, setIsloading] = useState(false);

  const [isServicesOpen, setIsServicesOpen] = useState(
    location.pathname.startsWith("/services"),
  );

  const [isCoursesOpen, setIsCoursesOpen] = useState(
    location.pathname.startsWith("/courses") ||
      location.pathname.startsWith("/services/courses"),
  );

  useEffect(() => {
    setIsServicesOpen(location.pathname.startsWith("/services"));
  }, [location.pathname]);

  useEffect(() => {
    setIsCoursesOpen(
      location.pathname.startsWith("/courses") ||
        location.pathname.startsWith("/services/courses"),
    );
    setIsExploreOpen(false);
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isExploreOpen) return undefined;

    const handlePointerDown = (event) => {
      const clickedMenu = exploreMenuRef.current?.contains(event.target);
      const clickedTrigger = exploreButtonRef.current?.contains(event.target);

      if (!clickedMenu && !clickedTrigger) setIsExploreOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setIsExploreOpen(false);
      exploreButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExploreOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      mobileMenuCloseButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        window.requestAnimationFrame(() =>
          mobileMenuButtonRef.current?.focus(),
        );
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        mobileMenuRef.current?.querySelectorAll(
          'a[href], button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 1280px)");
    const handleViewportChange = (event) => {
      if (event.matches) {
        setIsMobileMenuOpen(false);
      } else {
        setIsExploreOpen(false);
      }
    };

    desktopViewport.addEventListener("change", handleViewportChange);
    return () =>
      desktopViewport.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return undefined;

    const handlePointerDown = (event) => {
      const clickedDropdown = userProfileDropdownRef.current?.contains(
        event.target,
      );
      const clickedTrigger = dropwdownButtonRef.current?.contains(event.target);

      if (!clickedDropdown && !clickedTrigger) setIsProfileOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileOpen]);

  const { data: recordedData, isLoading: isCoursesLoading, isError: coursesError } = useGetRecordedCoursesQuery({ limit: 4 });
  const courseLinks = (recordedData?.courses || []).map((course) => ({ to: `/courses/${course.slug}`, label: course.title }));

  const serviceLinks = [
    { to: "/live-classes", label: "Live classes" },
    { to: "/services/interactive-lessons", label: "Interactive Lessons" },
    { to: "/services/educational-resources", label: "Educational Resources" },
    { to: "/services/spiritual-development", label: "Spiritual Development" },
    { to: "/services/community-engagement", label: "Community Engagement" },
    { to: "/services/personal-guidance", label: "Personal Guidance" },
    { to: "/services/language-support", label: "Language Support" },
    {
      to: "/services/family-focused-services",
      label: "Family Focused Services",
    },
    { to: "/services/youth-programs", label: "Youth Programs" },
    { to: "/services/islamic-events", label: "Islamic Events" },
  ];

  const navLinks = [
    { to: "/", label: "Home", icon: IoHomeOutline },
    { to: "/services", label: "Services", icon: FaServicestack },
    { to: "/courses", label: "Courses", icon: MdSubject },
    { to: "/live-classes", label: "Live Classes", icon: LibraryBig },
    { to: "/instructors", label: "Instructors", icon: UsersRound },
    { to: "/blogs", label: "Blogs", icon: MdSubject },
    { to: "/mission", label: "Mission", icon: Sparkles },
    { to: "/contact", label: "Contact", icon: MdOutlineConnectWithoutContact },
    { to: "/about", label: "About", icon: MdOutlineRoundaboutRight },
  ];

  const exploreSections = [
    {
      title: "Learning experiences",
      description: "Choose how you want to learn",
      icon: BookOpen,
      links: [
        { to: "/courses", label: "All courses" },
        { to: "/live-classes", label: "Live instructor-led classes" },
        { to: "/instructors", label: "Instructors" },
        { to: "/dashboard/learning", label: "My Learning" },
        { to: "/services/interactive-lessons", label: "Interactive lessons" },
        {
          to: "/services/educational-resources",
          label: "Educational resources",
        },
        { to: "/services/language-support", label: "Language support" },
      ],
    },
    {
      title: "Guidance & community",
      description: "Grow with scholars and families",
      icon: UsersRound,
      links: [
        { to: "/services/personal-guidance", label: "Personal guidance" },
        {
          to: "/services/spiritual-development",
          label: "Spiritual development",
        },
        {
          to: "/services/family-focused-services",
          label: "Family-focused learning",
        },
        { to: "/services/youth-programs", label: "Youth programs" },
        {
          to: "/services/community-engagement",
          label: "Community engagement",
        },
      ],
    },
    {
      title: "Discover",
      description: "Learn more about our platform",
      icon: Compass,
      links: [
        { to: "/blogs", label: "Articles & resources" },
        { to: "/services/islamic-events", label: "Islamic events" },
        { to: "/mission", label: "Our mission" },
        { to: "/about", label: "About QuranScholars" },
        { to: "/contact", label: "Contact us" },
      ],
    },
  ];

  const handleToggleSideNav = () => {
    setIsMobileMenuOpen((isOpen) => !isOpen);
    setIsExploreOpen(false);
    setIsProfileOpen(false);
  };

  const handleExploreToggle = () => {
    setIsExploreOpen((isOpen) => !isOpen);
    setIsProfileOpen(false);
  };

  const handleNavbarSearch = (event) => {
    event.preventDefault();
    const query = navbarSearch.trim();

    if (!query) return;

    navigate(`/courses?search=${encodeURIComponent(query)}`);
    setNavbarSearch("");
    setIsExploreOpen(false);
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenuAndRestoreFocus = () => {
    setIsMobileMenuOpen(false);
    window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  };

  const handleUserProfileDropdownToggle = () => {
    setIsProfileOpen((prev) => !prev);
    setIsExploreOpen(false);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsloading(true);
    try {
      const response = await logout();
      if (response.data) {
        localStorage.removeItem("user");
        setIsloading(false);
        dispatch(admissionApis.util.resetApiState());
        dispatch(setUser(null));
        navigate("/");
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
      }
    } catch (error) {
      console.log(error.message);
      setIsloading(false);
    }
  };
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface/90 font-body backdrop-blur-xl">
      <nav className="mx-auto flex min-h-18 w-full max-w-360 items-center gap-4 px-6 max-xl:justify-between max-xl:px-4 max-sm:min-h-16">
        {/* Logo Section */}
        <Link
          className="inline-flex shrink-0 items-center no-underline"
          to={"/"}
          aria-label="QuranScholars home"
        >
          <img
            className="h-auto w-36 object-contain sm:w-40"
            src={Logo}
            alt="Logo"
          />
        </Link>

        {/* Desktop primary navigation */}
        <div className="flex min-w-0 flex-1 items-center gap-2 max-xl:hidden">
          <button
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-bold leading-none text-primary-foreground transition-colors duration-200 hover:border-primary-hover hover:bg-primary/90",
              isExploreOpen && "border-primary-hover bg-primary/90",
            )}
            type="button"
            ref={exploreButtonRef}
            onClick={handleExploreToggle}
            aria-controls="explore-mega-menu"
            aria-expanded={isExploreOpen}
            aria-haspopup="true"
          >
            Explore
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                isExploreOpen && "rotate-180",
              )}
            />
          </button>

          <ul className="m-0 flex list-none items-center gap-1 p-0">
            <li>
              <NavLink className={desktopNavLinkClass} to="/courses">
                Courses
              </NavLink>
            </li>
            <li>
              <NavLink className={desktopNavLinkClass} to="/live-classes">
                Live Classes
              </NavLink>
            </li>
            <li>
              <NavLink className={desktopNavLinkClass} to="/instructors">
                Instructors
              </NavLink>
            </li>
            <li>
              <NavLink className={desktopNavLinkClass} to="/blogs">
                Resources
              </NavLink>
            </li>
          </ul>

          <form
            className="relative ml-1 min-w-52 max-w-xl flex-1"
            role="search"
            onSubmit={handleNavbarSearch}
          >
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-full border border-input bg-background py-2 pl-10 pr-12 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-faint-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="search"
              name="search"
              value={navbarSearch}
              onChange={(event) => setNavbarSearch(event.target.value)}
              placeholder="What do you want to learn?"
              aria-label="Search courses"
            />
            <button
              className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full border-0 bg-primary text-primary-foreground transition-colors hover:bg-primary-hover [&_svg]:size-4"
              type="submit"
              aria-label="Submit course search"
            >
              <ArrowRight />
            </button>
          </form>
        </div>

        {/* Desktop account actions */}
        <div className="flex shrink-0 items-center justify-end gap-2 max-xl:hidden">
          {user ? (
            <>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-bold leading-none text-foreground no-underline transition-colors duration-200 hover:bg-surface-alt"
                to="/donate"
              >
                Donate
              </Link>
              <div className="relative">
                <Button
                  className="min-h-11 gap-2 rounded-lg border-border bg-surface py-1 pl-1.5 pr-2 text-foreground hover:border-border-strong hover:bg-surface-alt"
                  type="button"
                  ref={dropwdownButtonRef}
                  onClick={handleUserProfileDropdownToggle}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                >
                  {data?.url ? (
                    <img
                      className="size-8 rounded-full object-cover"
                      src={data.url}
                      alt=""
                    />
                  ) : (
                    <UserCircle2 className="size-8 text-primary" />
                  )}
                  <div className="grid gap-0.5 text-left">
                    <p className="m-0 max-w-34 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-extrabold text-foreground">
                      {user?.name}
                    </p>
                    <p className="m-0 text-[0.72rem] font-semibold text-faint-foreground">
                      My account
                    </p>
                  </div>
                </Button>
                <div
                  className={cn(
                    "profile-dropdown absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-surface shadow-raised transition-all duration-200",
                    isProfileOpen
                      ? "visible pointer-events-auto translate-y-0 opacity-100"
                      : "invisible pointer-events-none -translate-y-1 opacity-0",
                  )}
                  ref={userProfileDropdownRef}
                  role="menu"
                >
                  <div className="border-b border-border bg-surface-alt p-4">
                    <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap font-extrabold text-foreground">
                      {user?.name}
                    </p>
                    <p className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <div className="grid gap-1 p-2">
                    <Link
                      className="flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold leading-none text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-4"
                      onClick={handleUserProfileDropdownToggle}
                      to={"/dashboard"}
                    >
                      <MdDashboard />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      className="flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold leading-none text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-4"
                      onClick={handleUserProfileDropdownToggle}
                      to="/my-learning"
                    >
                      <LibraryBig />
                      <span>My Learning</span>
                    </Link>
                    <Link
                      className="flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold leading-none text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-4"
                      onClick={handleUserProfileDropdownToggle}
                      to={"/profile"}
                    >
                      <User />
                      <span>Profile</span>
                    </Link>
                    <Link
                      className="flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold leading-none text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-4"
                      onClick={handleUserProfileDropdownToggle}
                      to={"/admission"}
                    >
                      <Sparkles />
                      <span>Admission</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        className="flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold leading-none text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-4"
                        onClick={handleUserProfileDropdownToggle}
                        to={"/admin/admissions"}
                      >
                        <ShieldCheck />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      className="flex min-h-9 w-full items-center gap-3 rounded-md border-0 bg-transparent px-3 py-2 text-left font-body text-sm font-semibold leading-none text-danger transition-colors duration-200 hover:bg-surface-alt [&_svg]:size-4"
                      onClick={handleLogout}
                    >
                      <LogOut />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-bold leading-none text-foreground no-underline transition-colors duration-200 hover:bg-surface-alt"
                to="/login"
              >
                Log in
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-bold leading-none text-primary-foreground no-underline transition-colors duration-200 hover:border-primary-hover hover:bg-primary/90"
                to="/get-started"
              >
                Join QuranScholar
              </Link>
            </>
          )}
        </div>

        <AnimatePresence>
          {isExploreOpen && (
            <motion.div
              id="explore-mega-menu"
              className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-b border-border bg-surface shadow-raised max-xl:hidden"
              ref={exploreMenuRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto grid w-full max-w-[90rem] grid-cols-[minmax(15rem,0.9fr)_repeat(3,minmax(0,1fr))] gap-0 px-6 py-6">
                <section className="rounded-xl bg-surface-alt p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <BookOpen className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">
                        Latest video courses
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Explore structured video lessons
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-1">
                    {isCoursesLoading && (
                      <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                        <LoadingState variant="inline" label="Loading courses..." />
                      </p>
                    )}
                    {coursesError && <p role="alert" className="px-3 py-2 text-sm text-muted-foreground">Courses could not be loaded. Open the catalog to try again.</p>}
                    {!isCoursesLoading && !coursesError && courseLinks.length === 0 && (
                      <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                        New courses are coming soon.
                      </p>
                    )}
                    {courseLinks.slice(0, 4).map((courseLink) => (
                      <NavLink
                        className={megaMenuLinkClass}
                        key={courseLink.to}
                        to={courseLink.to}
                        onClick={() => setIsExploreOpen(false)}
                      >
                        <span>{courseLink.label}</span>
                        <ArrowRight className="size-4 shrink-0 -translate-x-1 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100" />
                      </NavLink>
                    ))}
                  </div>

                  <Link
                    className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-primary no-underline hover:text-primary-hover"
                    to="/courses"
                    onClick={() => setIsExploreOpen(false)}
                  >
                    Browse courses
                    <ArrowRight className="size-4" />
                  </Link>
                </section>

                {exploreSections.map((section) => (
                  <section
                    className="border-l border-border px-6"
                    key={section.title}
                  >
                    <div className="flex items-start gap-3 px-3 pb-3">
                      <section.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div>
                        <h2 className="text-sm font-extrabold text-foreground">
                          {section.title}
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-1">
                      {section.links.map((link) => (
                        <NavLink
                          className={megaMenuLinkClass}
                          key={link.to}
                          to={link.to}
                          onClick={() => setIsExploreOpen(false)}
                        >
                          <span>{link.label}</span>
                          <ArrowRight className="size-4 shrink-0 -translate-x-1 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100" />
                        </NavLink>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="border-t border-border bg-surface-alt/70">
                <div className="mx-auto flex min-h-13 w-full max-w-[90rem] items-center justify-between gap-6 px-6 text-sm">
                  <p className="font-semibold text-muted-foreground">
                    Not sure where to begin? Explore every learning experience
                    in one place.
                  </p>
                  <div className="flex items-center gap-5">
                    <Link
                      className="font-bold text-foreground no-underline hover:text-primary"
                      to="/services"
                      onClick={() => setIsExploreOpen(false)}
                    >
                      View all services
                    </Link>
                    <Link
                      className="inline-flex items-center gap-2 font-extrabold text-primary no-underline hover:text-primary-hover"
                      to="/donate"
                      onClick={() => setIsExploreOpen(false)}
                    >
                      Support our mission
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Button */}
        <button
          className="hidden size-10 place-items-center rounded-md border border-border bg-surface text-foreground max-xl:grid [&_svg]:size-5"
          ref={mobileMenuButtonRef}
          onClick={handleToggleSideNav}
          type="button"
          aria-controls="mobile-navigation-drawer"
          aria-expanded={isMobileMenuOpen}
          aria-label={
            isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          <RxHamburgerMenu />
        </button>
      </nav>

      </header>

      {/* Mobile Menu: kept outside the filtered sticky header so its fixed
          viewport sizing and stacking are not constrained by the header. */}
      <div
        className={cn(
          "fixed inset-0 z-[210] max-w-[100vw] overflow-hidden overscroll-none transition-[visibility] duration-300 xl:hidden",
          isMobileMenuOpen
            ? "visible pointer-events-auto"
            : "invisible pointer-events-none delay-300",
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          className={cn(
            "absolute inset-0 z-0 border-0 bg-black/55 transition-opacity duration-300 motion-reduce:transition-none",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
          type="button"
          tabIndex={isMobileMenuOpen ? 0 : -1}
          aria-label="Close navigation menu"
          onClick={closeMobileMenuAndRestoreFocus}
        />
        <nav
          id="mobile-navigation-drawer"
          className={cn(
            "absolute right-0 top-0 z-10 flex h-dvh max-h-dvh w-[88vw] max-w-96 translate-x-full transform-gpu touch-pan-y flex-col overflow-x-hidden border-l border-border bg-surface shadow-raised transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none",
            isMobileMenuOpen && "translate-x-0",
          )}
          ref={mobileMenuRef}
          aria-label="Mobile navigation"
          aria-modal="true"
          inert={!isMobileMenuOpen}
          role="dialog"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-alt p-4">
            <div className="flex min-w-0 items-center gap-3">
              {user ? (
                <>
                  {data?.url ? (
                    <img
                      className="size-8 rounded-full object-cover"
                      src={data.url}
                      alt=""
                    />
                  ) : (
                    <UserCircle2 className="size-8 text-primary" />
                  )}
                  <div className="grid min-w-0 gap-0.5">
                    <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap font-display text-base font-extrabold text-foreground">
                      {user.name}
                    </p>
                    <p className="m-0 text-sm font-semibold text-muted-foreground">
                      Account
                    </p>
                  </div>
                </>
              ) : (
                <div className="grid min-w-0 gap-0.5">
                  <p className="m-0 font-display text-base font-extrabold text-foreground">
                    Welcome
                  </p>
                  <p className="m-0 text-sm font-semibold text-muted-foreground">
                    Sign in to continue
                  </p>
                </div>
              )}
            </div>
            <button
              className="grid size-10 place-items-center rounded-md border border-border bg-surface text-foreground [&_svg]:size-5"
              onClick={closeMobileMenuAndRestoreFocus}
              type="button"
              aria-label="Close navigation menu"
              ref={mobileMenuCloseButtonRef}
            >
              <IoMdClose />
            </button>
          </div>

          <form
            className="relative border-b border-border p-3"
            role="search"
            onSubmit={handleNavbarSearch}
          >
            <Search
              className="pointer-events-none absolute left-6 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              className="h-11 w-full rounded-full border border-input bg-background py-2 pl-10 pr-12 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-faint-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="search"
              name="mobile-search"
              value={navbarSearch}
              onChange={(event) => setNavbarSearch(event.target.value)}
              placeholder="Search courses"
              aria-label="Search courses"
            />
            <button
              className="absolute right-4 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border-0 bg-primary text-primary-foreground hover:bg-primary-hover [&_svg]:size-4"
              type="submit"
              aria-label="Submit course search"
            >
              <ArrowRight />
            </button>
          </form>

          <div className="flex flex-1 flex-col justify-between gap-4 overflow-y-auto overscroll-contain p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="grid gap-1">
              <p className="px-3 pb-1 pt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-faint-foreground">
                Explore
              </p>
              {navLinks.map((link) =>
                link.to === "/services" ? (
                  <div key={link.to}>
                    <button
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border-0 bg-transparent px-3 py-2 text-left font-body text-[0.95rem] font-bold text-muted-foreground transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                      type="button"
                      onClick={() => setIsServicesOpen((prev) => !prev)}
                      aria-controls="mobile-services-links"
                      aria-expanded={isServicesOpen}
                    >
                      <span className="flex items-center gap-3">
                        <link.icon />
                        {link.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "transition-transform duration-200",
                          isServicesOpen && "rotate-180",
                        )}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isServicesOpen && (
                        <motion.div
                          id="mobile-services-links"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                          <div className="grid gap-1 pb-2 pl-9 pt-1">
                            {serviceLinks.map((serviceLink) => (
                              <NavLink
                                className={mobileSubnavLinkClass}
                                key={serviceLink.to}
                                onClick={closeMobileMenu}
                                to={serviceLink.to}
                              >
                                {serviceLink.label}
                              </NavLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : link.to === "/courses" ? (
                  <div key={link.to}>
                    <button
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border-0 bg-transparent px-3 py-2 text-left font-body text-[0.95rem] font-bold text-muted-foreground transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                      type="button"
                      onClick={() => setIsCoursesOpen((prev) => !prev)}
                      aria-controls="mobile-course-links"
                      aria-expanded={isCoursesOpen}
                    >
                      <span className="flex items-center gap-3">
                        <link.icon />
                        {link.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "transition-transform duration-200",
                          isCoursesOpen && "rotate-180",
                        )}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isCoursesOpen && (
                        <motion.div
                          id="mobile-course-links"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                          <div className="grid gap-1 pb-2 pl-9 pt-1">
                            <NavLink
                              className={mobileSubnavLinkClass}
                              onClick={closeMobileMenu}
                              to="/courses"
                            >
                              Browse all courses
                            </NavLink>
                            {isCoursesLoading && (
                              <div className="rounded-md px-3 py-2 text-sm font-semibold leading-snug text-faint-foreground">
                                <LoadingState variant="inline" label="Loading courses..." />
                              </div>
                            )}
                            {coursesError && <p role="alert" className="px-3 py-2 text-sm text-muted-foreground">Courses could not be loaded. Open the catalog to try again.</p>}
                    {!isCoursesLoading && !coursesError && courseLinks.length === 0 && (
                              <div className="rounded-md px-3 py-2 text-sm font-semibold leading-snug text-faint-foreground">
                                No courses available
                              </div>
                            )}
                            {courseLinks.map((courseLink) => (
                              <NavLink
                                className={mobileSubnavLinkClass}
                                key={courseLink.to}
                                onClick={closeMobileMenu}
                                to={courseLink.to}
                              >
                                {courseLink.label}
                              </NavLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    className={mobileNavLinkClass}
                    key={link.to}
                    onClick={closeMobileMenu}
                    to={link.to}
                  >
                    <link.icon />
                    {link.label}
                  </NavLink>
                ),
              )}
            </div>

            <div className="grid gap-1 border-t border-border pt-3">
              {user ? (
                <>
                  <Link
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                    to="/dashboard"
                    onClick={closeMobileMenu}
                  >
                    Dashboard <MdDashboard />
                  </Link>
                  <Link
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                    to="/dashboard/learning"
                    onClick={closeMobileMenu}
                  >
                    My Learning <LibraryBig />
                  </Link>
                  <Link
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                    to="/donate"
                    onClick={closeMobileMenu}
                  >
                    Donate
                    <Sparkles />
                  </Link>
                  <Link
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                    to="/admission"
                    onClick={closeMobileMenu}
                  >
                    Admission <Sparkles />
                  </Link>
                  {isAdmin && (
                    <Link
                      className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                      to="/admin/admissions"
                      onClick={closeMobileMenu}
                    >
                      Admin Admissions <ShieldCheck />
                    </Link>
                  )}
                  <button
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border-0 bg-transparent px-3 py-2 text-left font-body text-[0.95rem] font-bold text-danger transition-colors duration-200 hover:bg-surface-alt [&_svg]:size-[1.1rem]"
                    onClick={handleLogout}
                  >
                    <LogOut />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                    onClick={closeMobileMenu}
                    to="/login"
                  >
                    Login <CgLogIn />
                  </Link>
                  <Link
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                    onClick={closeMobileMenu}
                    to="/donate"
                  >
                    Donate <Sparkles />
                  </Link>
                  <Link
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted-foreground no-underline transition-colors duration-200 hover:bg-surface-alt hover:text-foreground [&_svg]:size-[1.1rem]"
                    onClick={closeMobileMenu}
                    to="/get-started"
                  >
                    Get started <Sparkles />
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
