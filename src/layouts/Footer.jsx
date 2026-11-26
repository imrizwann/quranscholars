import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, ArrowUp, Globe2, Mail, MessageCircle, Phone } from "lucide-react";
import Brand from "@/components/branding/Brand.jsx";
import { contactDetails } from "@/data/contactDetails.js";
import "./footer.css";

// Account links depend on whether someone is signed in.
const guestLinks = [
  { to: "/login", label: "Log in" },
  { to: "/register", label: "Create an account" },
];
const memberLinks = [
  { to: "/dashboard/learning", label: "My learning" },
  { to: "/dashboard/purchases", label: "Purchases" },
  { to: "/profile", label: "Profile" },
];

function footerColumns(signedIn) {
  return [
    {
      title: "Learn",
      links: [
        { to: "/courses", label: "All courses" },
        { to: "/instructors", label: "Our teachers" },
        ...(signedIn ? memberLinks : guestLinks),
        // { to: "/live-classes", label: "Live classes" }, // Post-MVP
        // { to: "/blogs", label: "Articles" },            // Post-MVP
      ],
    },
    {
      title: "Teach",
      links: [
        { to: "/get-started/instructor", label: "Teach on DarsLearn" },
        { to: "/instructor/application", label: "Apply to teach" },
      ],
    },
    {
      title: "Company",
      links: [
        { to: "/about", label: "About us" },
        { to: "/mission", label: "Our mission" },
        { to: "/donate", label: "Donate" },
        // { to: "/services", label: "Services" }, // Post-MVP
      ],
    },
    {
      title: "Support",
      links: [
        { to: "/contact", label: "Contact us" },
        { to: "/course-policy", label: "Access & refunds" },
        { to: "/privacy", label: "Privacy policy" },
      ],
    },
  ];
}

function scrollToTop() {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

export default function Footer() {
  const signedIn = useSelector(state => Boolean(state.user?.user?._id));
  const { pathname } = useLocation();
  // These pages end with their own call to action or contact section, so the help strip would repeat it.
  // Sign-in and account pages stay focused on the form and already offer "Need help? Contact the team".
  const showHelp = ![
    "/", "/contact", "/get-started/instructor", "/donate",
    "/login", "/register", "/forgot-password", "/reset-password", "/verify-email",
  ].includes(pathname);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <span className="site-footer-pattern" aria-hidden="true" />
      <div className="page-container">
        {showHelp && <div className="site-footer-help">
          <div>
            <h2>Not sure where to start?</h2>
            <p>Tell us what you would like to learn and we will help you choose the right course.</p>
          </div>
          <div className="site-footer-help-actions">
            <Link to="/contact" className="site-footer-button site-footer-button--gold">Contact our team<ArrowRight size={16} aria-hidden="true" /></Link>
            <a href={contactDetails.whatsappHref} target="_blank" rel="noopener noreferrer" className="site-footer-button">
              <MessageCircle size={17} aria-hidden="true" />Chat on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>}

        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Link to="/" aria-label="DarsLearn home" className="site-footer-logo"><Brand tone="dark" /></Link>
            <p>Structured online courses with clear lessons, qualified teachers and progress that follows you on every device.</p>
            <ul className="site-footer-contact" aria-label="Contact details">
              <li><Mail size={16} aria-hidden="true" /><a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a></li>
              <li><Phone size={16} aria-hidden="true" /><a href={contactDetails.phoneHref}>{contactDetails.phone}</a></li>
              <li><Globe2 size={16} aria-hidden="true" /><span>Learn online, from anywhere</span></li>
            </ul>
          </div>

          <div className="site-footer-columns">
            {footerColumns(signedIn).map(column => (
              <nav key={column.title} aria-label={column.title}>
                <h2>{column.title}</h2>
                <ul>
                  {column.links.map(link => <li key={link.to}><Link to={link.to}>{link.label}</Link></li>)}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>&copy; {year} DarsLearn. All rights reserved.</p>
          <button type="button" className="site-footer-top" onClick={scrollToTop}>Back to top<ArrowUp size={15} aria-hidden="true" /></button>
        </div>
      </div>
    </footer>
  );
}
