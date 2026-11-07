import Brand from "@/components/branding/Brand.jsx";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { contactDetails } from "@/data/contactDetails.js";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { to: "/courses", label: "All courses" },
      // { to: "/live-classes", label: "Live Classes" },
      { to: "/instructors", label: "Instructors" },
      // { to: "/services", label: "Services" },
      { to: "/get-started/instructor", label: "Teach on QuranScholar" },
      // { to: "/blogs", label: "Blogs" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/mission", label: "Mission" },
      { to: "/donate", label: "Donate" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/login", label: "Login" },
      { to: "/register", label: "Register" },
      { to: "/dashboard/learning", label: "My Learning" },
      { to: "/privacy", label: "Privacy" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface text-foreground">
      <div className="page-container">
        <div className="flex flex-col gap-6 border-b border-border py-8 lg:flex-row lg:items-center lg:justify-between">
          <Link
            to="/"
            aria-label="QuranScholar home"
            className="flex min-w-0 flex-col items-start gap-4 no-underline sm:flex-row sm:items-center"
          >
            <span className="inline-flex shrink-0 items-center gap-2.5 text-lg text-foreground"><Brand /></span>
            <span className="hidden h-8 w-px bg-border sm:block" />
            <span className="max-w-sm text-sm font-medium leading-6 text-muted-foreground">
              Online Quran and Islamic learning with structured courses,
              clear lessons, and trusted teacher support.
            </span>
          </Link>

          <div className="flex min-w-0 flex-col items-start gap-3 lg:shrink-0">
            <p className="text-sm font-semibold">Need help choosing where to begin?</p>
            <Link to="/contact" className="cw-button cw-primary min-h-11">Contact our team<ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>

        <div className="grid gap-8 py-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="grid gap-8 sm:grid-cols-3 lg:min-w-[34rem]">
            {footerColumns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-sm font-bold text-foreground">
                  {column.title}
                </h2>
                <div className="mt-3 grid gap-2">
                  {column.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="w-fit text-sm font-medium leading-6 text-muted-foreground no-underline transition hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>
            ))}
          </div>

          <div className="grid gap-5 lg:justify-items-end">
            <div className="grid gap-3 text-sm font-medium text-muted-foreground lg:text-right">
              <a className="inline-flex min-h-10 min-w-0 items-center gap-2 break-all hover:text-primary lg:justify-end" href={`mailto:${contactDetails.email}`}>
                <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {contactDetails.email}
              </a>
              <a className="inline-flex min-h-10 items-center gap-2 hover:text-primary lg:justify-end" href={contactDetails.phoneHref}>
                <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {contactDetails.phone}
              </a>
              <p className="inline-flex items-center gap-2 lg:justify-end">
                <MapPin className="size-4 text-primary" />
                Online classes worldwide
              </p>
            </div>

          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium">
            &copy; {new Date().getFullYear()} QuranScholar. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/privacy"
              className="font-semibold no-underline transition hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              to="/contact"
              className="font-semibold no-underline transition hover:text-primary"
            >
              Support
            </Link>
            <Link
              to="/courses"
              className="font-semibold no-underline transition hover:text-primary"
            >
              Courses
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
