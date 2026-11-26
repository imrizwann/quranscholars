import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, ChevronRight, Clock3, Globe2, Layers3, MonitorPlay, PlayCircle, Signal, Users, VideoOff } from "lucide-react";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
import CourseEnrollment from "@/features/recorded-courses/components/CourseEnrollment.jsx";
import CourseShareButton from "@/features/recorded-courses/components/CourseShareButton.jsx";
import CourseRating from "@/features/recorded-courses/components/CourseRating.jsx";
import CourseVideo from "@/features/recorded-courses/components/CourseVideo.jsx";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import { instructorProfileUrl } from "@/features/profile/instructor-link.js";
import { useGetCourseAccessQuery } from "@/services/api/user/paymentApi.js";
import { courseFaqs, courseSections, OUTCOME_PREVIEW } from "./courseDetailContent.js";

const number = new Intl.NumberFormat("en-IN");
const plural = (count, word) => `${number.format(count)} ${count === 1 ? word : `${word}s`}`;

function savingPercent(price) {
  if (!price.discounted || !(price.original > 0)) return 0;
  return Math.round((1 - price.current / price.original) * 100);
}

/* ---------- Hero ---------- */

export function CourseHero({ course, catalogUrl, catalogState, updated }) {
  return <header className="cd-hero">
    <nav className="cd-breadcrumbs" aria-label="Breadcrumb">
      <Link to={catalogUrl} state={catalogState}><ArrowLeft aria-hidden="true" />All courses</Link><ChevronRight aria-hidden="true" /><span>{course.category}</span>
    </nav>
    <div className="cd-badges">
      <span className="cd-badge"><MonitorPlay aria-hidden="true" />Self-paced course</span>
      {course.level !== "Not specified" && <span className="cd-badge cd-badge--plain"><Signal aria-hidden="true" />{course.level}</span>}
    </div>
    <h1>{course.title}</h1>
    {course.shortDescription && <p className="cd-intro">{course.shortDescription}</p>}
    <div className="cd-hero-proof">
      <a href="#course-reviews" className="course-rating-link"><CourseRating rating={course.rating} reviews={course.totalReviews} light /></a>
      {course.totalStudents > 0 && <span><Users aria-hidden="true" />{plural(course.totalStudents, "learner")}</span>}
    </div>
    <div className="cd-hero-meta">
      <a href="#course-instructor" className="cd-instructor-link"><ProfileAvatar name={course.instructor.name} src={course.instructor.avatar} size={30} /><span>Taught by <strong>{course.instructor.name}</strong></span></a>
      <span><Globe2 aria-hidden="true" />{course.language}</span>
      {updated && <span>Updated {updated}</span>}
      <span className="cd-hero-share"><CourseShareButton course={course} /></span>
    </div>
  </header>;
}

/* ---------- Enrollment card ---------- */

// On desktop the card stays in view. Once the hero has scrolled away it drops the
// preview so the price, button and terms always fit below the navbar.
const DESKTOP = "(min-width: 1024px)";
function useCompactCard() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const hero = document.querySelector(".cd-hero");
    if (!hero || typeof IntersectionObserver === "undefined" || !window.matchMedia) return;
    const desktop = window.matchMedia(DESKTOP);
    let pastHero = false;
    const apply = () => setCompact(desktop.matches && pastHero);
    const observer = new IntersectionObserver(([entry]) => {
      pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      apply();
    }, { rootMargin: "-92px 0px 0px 0px" });
    observer.observe(hero);
    desktop.addEventListener("change", apply);
    // Links to the preview scroll back up, where the full card shows it again.
    const openPreview = event => {
      const link = event.target.closest?.('a[href="#course-preview"]');
      if (!link || !desktop.matches || !pastHero) return;
      event.preventDefault();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      // Focus once the preview has expanded again.
      setTimeout(() => document.getElementById("course-preview")?.focus({ preventScroll: true }), reduce ? 0 : 700);
    };
    document.addEventListener("click", openPreview);
    return () => { observer.disconnect(); desktop.removeEventListener("change", apply); document.removeEventListener("click", openPreview); };
  }, []);
  useEffect(() => {
    // A hidden trailer must not keep playing.
    if (compact) document.querySelectorAll("#course-preview video").forEach(video => video.pause());
  }, [compact]);
  return compact;
}

export function EnrollCard({ course, trailerSource }) {
  const saving = savingPercent(course.price);
  const includes = [
    course.totalLessons > 0 ? `${plural(course.totalLessons, "recorded lesson")}` : "Recorded course lessons",
    course.totalDurationSeconds > 0 ? `${course.durationLabel} of video` : null,
    "Learn at your own pace, on any device",
    "Saved progress across your devices",
  ].filter(Boolean);
  const compact = useCompactCard();

  return <aside className="cd-sidebar" aria-label="Course enrollment and details">
    <div className="cd-card" id="course-enrollment" tabIndex={-1} data-compact={compact || undefined}>
      <div className="cd-collapse" data-open={compact || undefined} aria-hidden="true"><div><p className="cd-card-heading">{course.title}</p></div></div>
      <div className="cd-collapse" data-open={!compact || undefined} inert={compact || undefined}><div>
        <section id="course-preview" className="cd-card-media" aria-labelledby="preview-heading" tabIndex={-1}>
          {trailerSource ? <>
            <div className="cd-video-stage"><CourseVideo src={trailerSource} poster={course.thumbnail} title={`${course.title} — course trailer`} /></div>
            <div className="cd-media-caption"><PlayCircle aria-hidden="true" /><div><h2 id="preview-heading">A first look at your course</h2><p>Free preview. Watch it before you enroll.</p></div></div>
          </> : <>
            <div className="cd-card-cover">
              {course.thumbnail && <img src={course.thumbnail} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
              <span className="cd-card-cover-title" aria-hidden="true">{course.title}</span>
            </div>
            <div className="cd-media-caption"><VideoOff aria-hidden="true" /><div><h2 id="preview-heading">No trailer available</h2><p><a href="#course-curriculum">See the full lesson outline</a></p></div></div>
          </>}
        </section>
      </div></div>

      <div className="cd-card-body">
        <div className="cd-price">
          <CoursePrice price={course.price} size="large" />
          {saving > 0 && <span className="cd-save">Save {saving}%</span>}
        </div>
        <CourseEnrollment course={course} />
        <div className="cd-purchase-includes">
          <h3>Included with enrollment</h3>
          <ul>{includes.map(item => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul>
          <p>Downloadable materials are available on lessons where your instructor provides them.</p>
        </div>
        <p className="cd-purchase-terms">Before enrolling, review our <Link to="/course-policy">course access and refund policy</Link>. Questions about access or refunds? <Link to="/contact">Contact our team.</Link></p>
      </div>
    </div>
  </aside>;
}

/* ---------- At a glance ---------- */

export function GlanceStrip({ course }) {
  const items = [
    { icon: Layers3, label: "Lessons", value: course.totalLessons == null ? "Lesson count not listed" : plural(course.totalLessons, "lesson") },
    { icon: Clock3, label: "Video", value: course.totalDurationSeconds > 0 ? course.durationLabel : "Duration not listed" },
    { icon: Signal, label: "Level", value: course.level },
    { icon: Globe2, label: "Language", value: course.language },
  ];
  return <dl className="cd-glance" aria-label="Course at a glance">
    {items.map(({ icon: Icon, label, value }) => <div key={label}><span className="cd-glance-icon"><Icon aria-hidden="true" /></span><div><dt>{label}</dt><dd>{value}</dd></div></div>)}
  </dl>;
}

/* ---------- Section navigation with scroll spy ---------- */

export function SectionNav() {
  const [active, setActive] = useState(courseSections[0].id);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = courseSections[0].id;
      for (const { id } of courseSections) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 160) current = id;
      }
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return <nav className="cd-section-nav" aria-label="Course sections">
    {courseSections.map(section => <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? "true" : undefined}>{section.label}</a>)}
  </nav>;
}

/* ---------- Learning outcomes ---------- */

export function Outcomes({ outcomes }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? outcomes : outcomes.slice(0, OUTCOME_PREVIEW);
  const hidden = outcomes.length - OUTCOME_PREVIEW;
  return <div className="cd-outcomes">
    <ul>{visible.map((outcome, index) => <li key={index}><span><Check aria-hidden="true" /></span>{outcome}</li>)}</ul>
    {hidden > 0 && <button type="button" className="cd-text-button" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>
      {showAll ? "Show fewer" : `Show all ${outcomes.length} outcomes`}<ChevronDown size={16} className={showAll ? "rotate-180" : undefined} aria-hidden="true" />
    </button>}
  </div>;
}

/* ---------- Requirements and audience ---------- */

export function Readiness({ course }) {
  if (!course.requirements.length && !course.audience.length) return null;
  const groups = [
    { key: "requirements", icon: BookOpen, title: "Before you begin", items: course.requirements },
    { key: "audience", icon: Users, title: "Who this course is for", items: course.audience },
  ].filter(group => group.items.length);
  return <section className="cd-section cd-readiness" aria-label="Requirements and audience">
    {groups.map(({ key, icon: Icon, title, items }) => <div key={key} className="cd-readiness-card">
      <span className="cd-small-icon"><Icon aria-hidden="true" /></span>
      <h2>{title}</h2>
      <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>
    </div>)}
  </section>;
}

/* ---------- Instructor ---------- */

export function InstructorSection({ instructor }) {
  const profile = instructorProfileUrl(instructor);
  return <section id="course-instructor" className="cd-section" aria-labelledby="instructor-heading">
    <p className="cd-eyebrow">Learn with guidance</p><h2 id="instructor-heading">Meet your instructor</h2>
    <div className="cd-instructor-card">
      <ProfileAvatar name={instructor.name} src={instructor.avatar} size={72} />
      <div>
        <h3>{instructor.name}</h3>
        <p className="cd-instructor-role">{instructor.title}</p>
        {instructor.bio && <p className="cd-description">{instructor.bio}</p>}
        {profile && <Link className="cw-button cd-instructor-profile" to={profile}>View instructor profile<ArrowUpRight size={16} aria-hidden="true" /></Link>}
      </div>
    </div>
  </section>;
}

/* ---------- FAQ ---------- */

export function CourseFaq({ course }) {
  const items = courseFaqs.filter(item => !item.paidOnly || course.price.current > 0);
  return <section id="course-faq" className="cd-section" aria-labelledby="faq-heading">
    <p className="cd-eyebrow">Good to know</p><h2 id="faq-heading">Frequently asked questions</h2>
    <div className="cd-faq">
      {items.map(item => <details key={item.question}>
        <summary>{item.question}<ChevronDown aria-hidden="true" /></summary>
        <p>{item.answer}{item.link && <> <Link to={item.link.to}>{item.link.label}</Link>.</>}</p>
      </details>)}
    </div>
    <p className="cd-faq-more">Still have a question? <Link to="/contact">Contact our team</Link> and we will help you decide.</p>
  </section>;
}

/* ---------- Mobile enroll bar ---------- */

export function MobileEnrollBar({ course }) {
  const user = useSelector(state => state.user.user);
  const access = useGetCourseAccessQuery(course.id, { skip: !user?._id || !course.id });
  const [visible, setVisible] = useState(false);
  const owner = user?.role === "instructor" && String(course.instructor.id) === String(user._id);
  const active = access.currentData?.canAccessCourse === true && !access.error;
  const free = course.price.current === 0;

  useEffect(() => {
    const card = document.getElementById("course-enrollment");
    if (!card || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  if (owner || (course.enrollmentOpen === false && !active)) return null;
  return <div className="cd-mobile-bar" data-visible={visible || undefined} aria-hidden={!visible || undefined} inert={!visible || undefined}>
    <div className="cd-mobile-bar-price">
      <CoursePrice price={course.price} />
      <span>{course.title}</span>
    </div>
    {active
      ? <Link className="cw-button cw-primary" to={`/learn/${encodeURIComponent(course.slug)}`}>Go to course<ArrowRight size={16} aria-hidden="true" /></Link>
      : <a className="cw-button cw-primary" href="#course-enrollment">{free ? "Enroll for free" : "Enroll now"}<ArrowRight size={16} aria-hidden="true" /></a>}
  </div>;
}
