import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useGetRecordedCourseBySlugQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";

const names = { "/": "Quran & Islamic learning", "/courses": "Recorded courses", "/about": "About", "/contact": "Contact", "/course-policy": "Course access & refunds", "/privacy": "Privacy policy", "/get-started": "Get started", "/login": "Sign in", "/register": "Create your account", "/forgot-password": "Forgot password", "/reset-password": "Reset password" };
function siteOrigin(value = import.meta.env.VITE_PUBLIC_SITE_URL) {
  try { const url = new URL(value); if (url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash) return url.origin; } catch { /* Use the established public domain. */ }
  return "https://www.quranscholar.in";
}
export default function RouteMetadata() {
  const { pathname } = useLocation();
  const match = /^\/courses\/([^/]+)\/?$/.exec(pathname);
  let slug;
  try { slug = match ? decodeURIComponent(match[1]) : null; } catch { slug = null; }
  const query = useGetRecordedCourseBySlugQuery(slug, { skip: !slug });
  const course = !query.error ? query.currentData : null;
  const privatePage = /^\/(?:learn|dashboard|admin|instructor|profile|login|register|forgot-password|reset-password|verify-email|account-deleted)(?:\/|$)/.test(pathname);
  useEffect(() => {
    const origin = siteOrigin();
    const heading = course?.title || names[pathname] || (slug ? query.isError ? "Course unavailable" : "Course details" : privatePage ? "Your account" : "QuranScholar");
    const title = heading === "QuranScholar" ? heading : `${heading} | QuranScholar`;
    const description = (course?.shortDescription || "Learn through structured recorded courses on QuranScholar. Explore lessons, meet your instructor, and continue your learning at your pace.").replace(/\s+/g, " ").slice(0, 220);
    const image = course?.thumbnail || `${origin}/og-image.png`;
    const canonical = new URL(pathname, origin).href;
    document.title = title;
    for (const [attribute, key, content] of [
      ["name", "description", description], ["name", "robots", privatePage || query.isError ? "noindex, nofollow" : "index, follow"],
      ["property", "og:title", title], ["property", "og:description", description], ["property", "og:type", "website"],
      ["property", "og:site_name", "QuranScholar"], ["property", "og:url", canonical], ["property", "og:image", image],
      ["name", "twitter:card", "summary_large_image"], ["name", "twitter:title", title], ["name", "twitter:description", description], ["name", "twitter:image", image],
    ]) {
      let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attribute, key); document.head.appendChild(tag); }
      tag.setAttribute("content", content);
    }
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
  }, [pathname, slug, course, query.isError, privatePage]);
  return null;
}
