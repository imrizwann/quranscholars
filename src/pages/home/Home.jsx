import { useId, useState } from "react";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  UsersRound,
  Check,
  ChevronDown,
  Quote,
  ShieldCheck,
} from "lucide-react";
import heroWomanTransparent from "@/assets/images/hero-woman-transparent.svg";

import {
  showcaseStats,
  learningFormats,
  platformFeatures,
  teachers,
  testimonials,
  faqs,
} from "@/data/homeData.js";
import RecordedCourseSkeleton from "@/features/recorded-courses/components/RecordedCourseSkeleton.jsx";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import { useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { liveClasses } from "@/data/lmsData.js";
import { LiveClassCard } from "@/pages/live-classes/LiveClasses.jsx";
import CourseCardMedia from "@/features/recorded-courses/components/CourseCardMedia.jsx";
import "./home.css";



const SectionLabel = ({ children, light = false }) => (
  <div
    className={
      "mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] " +
      (light ? "text-[#9ed6c8]" : "text-primary")
    }
  >
    <span className={"h-px w-7 " + (light ? "bg-[#9ed6c8]" : "bg-primary")} />
    {children}
  </div>
);

const Home = () => {
  const { data: recordedData, isLoading: coursesLoading, isError: coursesError, refetch: retryCourses } = useGetRecordedCoursesQuery({ limit: 3 });
  const homeRecordedCourses = recordedData?.courses || [];
  const featuredCourse = homeRecordedCourses.find(course => course.trailerVideo) || homeRecordedCourses[0];
  const [openFaq, setOpenFaq] = useState(0);
  const faqId = useId();
  const prefersReducedMotion = useReducedMotion();

  const reveal = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 24,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.65,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <main className="home-page overflow-hidden bg-[#fbfcfa] text-[#14231e] z-0">
      {/* Showcase */}
      <section
        id="main"
        className="home-hero relative isolate overflow-hidden bg-[#082f2b] text-white"
        aria-labelledby="home-hero-title"
      >
        <div
          className="absolute inset-0 -z-30 bg-[linear-gradient(135deg,#061f1c_0%,#0b463f_46%,#11231d_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-0 -z-20 w-full overflow-hidden lg:w-[66%]"
          aria-hidden="true"
        >
          <img
            className="absolute bottom-0 -right-28 h-[88%] max-h-172 w-auto max-w-none object-contain object-bottom opacity-30 sm:right-[-4rem] sm:opacity-40 lg:right-[max(-1.5rem,calc((100vw-80rem)/2))] lg:h-[94%] lg:opacity-95"
            src={heroWomanTransparent}
            alt=""
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#082f2b_0%,rgba(8,47,43,.96)_34%,rgba(8,47,43,.62)_62%,rgba(8,47,43,.08)_100%)] lg:bg-[linear-gradient(90deg,#082f2b_0%,rgba(8,47,43,.94)_28%,rgba(8,47,43,.38)_58%,rgba(8,47,43,.03)_100%)]" />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 bg-[linear-gradient(0deg,#ffffff_0%,rgba(255,255,255,0)_100%)] opacity-95"
          aria-hidden="true"
        />

        <div className="home-hero-layout mx-auto grid min-h-[calc(100svh-7.5rem)] w-full max-w-7xl content-start gap-10 px-6 pb-18 pt-14 lg:min-h-[640px] lg:grid-cols-[minmax(0,0.94fr)_minmax(22rem,0.66fr)] lg:content-center lg:items-end lg:pb-16 lg:pt-18 max-sm:min-h-[calc(100svh-6rem)] max-sm:px-4 max-sm:pb-12 max-sm:pt-9">
          <motion.div
            className="min-w-0 py-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: prefersReducedMotion ? 0 : 0.1,
                },
              },
            }}
          >
            <motion.div
              variants={reveal}
              className="mb-5 inline-flex max-w-full items-center gap-2 rounded-md border border-white/[.18] bg-white/[.09] px-3.5 py-2 text-[0.68rem] font-black uppercase tracking-[0.15em] text-[#d6efe8] backdrop-blur max-sm:text-[0.6rem] max-sm:tracking-[0.1em]"
            >
              <ShieldCheck className="size-3.5 text-[#f4c95d]" />
              Quran & Islamic learning, at your pace
            </motion.div>

            <motion.h1
              id="home-hero-title"
              variants={reveal}
              className="max-w-196 text-balance font-display text-[clamp(3rem,6.6vw,6.1rem)] font-black leading-[0.96] tracking-normal text-white max-sm:text-[2.48rem] max-sm:leading-[1.04]"
            >
              <span>IQRA</span> <span className="text-[#f4c95d]">ILM</span>{" "}
              <span className="">DEEN</span>
            </motion.h1>

            <motion.p
              variants={reveal}
              className="mt-6 max-w-172 text-pretty text-[clamp(1.05rem,1.45vw,1.24rem)] font-medium leading-[1.75] text-white/[.74]"
            >
              Learn Quran, Tajweed, Hadith, Fiqh, and family-focused Islamic
              studies with structured courses, practical lessons, and guidance
              to help you build a consistent learning routine.
            </motion.p>

            <motion.div
              variants={reveal}
              className="home-hero-actions mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/courses"
                className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg bg-[#f4c95d] px-6 text-sm font-black text-[#102f2a] no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffd978] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4c95d]"
              >
                Explore courses
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/get-started"
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border border-white/[.24] bg-white/10 px-6 text-sm font-black text-white no-underline backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/[.16] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <GraduationCap className="size-[1.1rem] text-[#9ad8ca]" aria-hidden="true" />
                Get started
              </Link>
              <Link to="/instructor/application" className="home-mobile-instructor-link">Become an instructor<ArrowRight size={15} aria-hidden="true" /></Link>
            </motion.div>

            <motion.div
              variants={reveal}
              className="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-lg border border-white/[.12] bg-white/10 backdrop-blur home-hero-highlights"
              aria-label="Platform highlights"
            >
              {showcaseStats.map((stat) => (
                <div
                  className="border-white/12 bg-[#061f1c]/40 p-4 max-sm:border-t sm:border-l first:border-0"
                  key={stat.label}
                >
                  <p className="font-display text-2xl font-black leading-none text-white">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-white/[.58]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.aside className="home-start-panel" initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : .5, ease: [.16, 1, .3, 1] }} aria-labelledby="home-start-title">
            <p className="public-eyebrow">A place to begin</p><h2 id="home-start-title">Make room for meaningful learning.</h2><p>Choose your next step. You can always explore the other paths later.</p>
            <div className="home-start-links">{[
              { to: "/courses", title: "Explore courses", detail: "Find a subject and level that fit you.", icon: BookOpen },
              { to: "/dashboard/learning", title: "My learning", detail: "Return to your courses and saved progress.", icon: GraduationCap },
              { to: "/get-started/instructor", title: "Become an instructor", detail: "Share your knowledge with learners.", icon: UsersRound },
            ].map(({ to, title, detail, icon: Icon }) => <Link key={to} to={to}><span className="home-start-icon"><Icon size={19} aria-hidden="true" /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div>
          </motion.aside>
        </div>
      </section>

      {/* Learning Formats */}
      <section className="relative z-10 border-y border-[#e6e9e5] bg-white">
        <div className="mx-auto grid max-w-7xl md:grid-cols-3">
          {learningFormats.map(({ icon: Icon, title, text }, index) => (
            <div
              className={
                "flex gap-4 px-6 py-7 lg:px-9 " +
                (index
                  ? "border-t border-[#e6e9e5] md:border-l md:border-t-0"
                  : "")
              }
              key={title}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f4f0] text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="text-sm md:text-md font-black text-[#20332c]">
                  {title}
                </h2>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#6a7671]">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section
        id="courses"
        className="scroll-mt-24 bg-[#fbfcfa] px-6 py-24 max-sm:px-4 max-sm:py-18"
      >
        <motion.div
          className="mx-auto max-w-7xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={reveal}
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <SectionLabel>Latest self-paced courses</SectionLabel>
              <h2 className="text-balance font-display text-[clamp(2.2rem,4vw,3.65rem)] font-black leading-[1.04] tracking-[-0.045em]">
                Start now. Learn at your own pace.
              </h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-[#66736e]">
                Learn through professional, structured video lessons and return
                exactly where you left off.
              </p>
            </div>
            <Link
              to="/courses"
              className="group inline-flex items-center gap-2 text-sm font-black text-primary no-underline"
            >
              View self-paced courses
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="home-course-grid mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy={coursesLoading}>
            {coursesLoading && <span className="sr-only" role="status">Loading courses</span>}
            {coursesLoading ? Array.from({ length: 3 }, (_, index) => <RecordedCourseSkeleton key={index} />) : coursesError ? (
              <div className="home-course-state" role="alert"><BookOpen size={24} aria-hidden="true" /><div><h3>Courses are temporarily unavailable</h3><p>Please try again in a moment.</p></div><button type="button" onClick={retryCourses} className="cw-button">Try again</button></div>
            ) : !homeRecordedCourses.length ? <div className="home-course-state" role="status"><BookOpen size={24} aria-hidden="true" /><div><h3>New courses are on the way</h3><p>Contact our team for help finding your next learning opportunity.</p></div><Link to="/contact" className="cw-button">Contact us<ArrowRight size={15} aria-hidden="true" /></Link></div> : homeRecordedCourses.map((course) => (
              <RecordedCourseCard key={course.id} course={course} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Live Classes */}
      <section className="border-t border-[#e3e9e5] bg-white px-6 py-24 max-sm:px-4 max-sm:py-18">
        <motion.div
          className="mx-auto max-w-7xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={reveal}
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <SectionLabel>Instructor-led programs</SectionLabel>
              <h2 className="text-balance font-display text-[clamp(2.2rem,4vw,3.65rem)] font-black leading-[1.04] tracking-[-0.045em]">
                Learn live. Grow with guidance.
              </h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-[#66736e]">
                Follow a schedule, ask questions and build lasting study habits
                with an instructor and learning community.
              </p>
            </div>
            <Link
              to="/live-classes"
              className="group inline-flex items-center gap-2 text-sm font-black text-primary no-underline"
            >
              Explore live classes
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="home-course-grid mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {liveClasses.map((item) => (
              <LiveClassCard key={item.id} item={item} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Platform */}
      <section
        id="platform"
        className="scroll-mt-24 bg-[#0b3e38] px-6 py-24 text-white max-sm:px-4 max-sm:py-18"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.92fr_1.08fr] lg:gap-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
          >
            <SectionLabel light>
              Built for serious self-paced study
            </SectionLabel>
            <h2 className="text-balance font-display text-[clamp(2.3rem,4vw,3.8rem)] font-black leading-[1.03] tracking-[-0.045em]">
              Self-paced courses that feel thoughtfully taught.
            </h2>
            <p className="mt-6 max-w-xl text-base font-medium leading-[1.8] text-white/68">
              Focus on the lesson, with clear course sections, video that
              adapts to your connection, and saved progress that helps you
              pick up where you left off.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Adaptive video quality",
                "Structured chapters",
                "Saved lesson progress",
                "Works across devices",
              ].map((item) => (
                <div
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.055] px-4 py-3 text-sm font-bold text-white/82"
                  key={item}
                >
                  <span className="grid size-6 place-items-center rounded-full bg-[#f3c65a] text-[#123a33]">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
          >
            <div className="home-course-spotlight">
              {featuredCourse ? <><CourseCardMedia key={featuredCourse.id} course={featuredCourse} to={`/courses/${featuredCourse.slug}`} /><div className="home-spotlight-copy"><div><p>Course spotlight</p><h3>{featuredCourse.title}</h3><span><InstructorByline instructor={featuredCourse.instructor} photo={false} /></span></div><Link to={`/courses/${featuredCourse.slug}`} className="cw-button">View course<ArrowRight size={15} aria-hidden="true" /></Link></div></> : <div className="home-spotlight-empty"><BookOpen size={32} aria-hidden="true" /><h3>Your next chapter starts here.</h3><p>Find a subject that inspires you, then follow a clear path through each lesson.</p><Link to="/courses" className="cw-button">Explore courses<ArrowRight size={16} aria-hidden="true" /></Link></div>}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Quran Scholars */}
      <section className="bg-white px-6 py-24 max-sm:px-4 max-sm:py-18">
        <motion.div
          className="mx-auto max-w-7xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={reveal}
        >
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
            <div>
              <SectionLabel>Why Quran Scholars</SectionLabel>
              <h2 className="text-balance font-display text-[clamp(2.2rem,3.6vw,3.4rem)] font-black leading-[1.05] tracking-[-0.045em]">
                Technology should support the teacher, not replace them.
              </h2>
              <p className="mt-5 text-base font-medium leading-[1.75] text-[#68756f]">
                Every part of the platform is designed around clarity,
                consistency, and trusted guidance, not endless content.
              </p>
              <Link
                to="/about"
                className="mt-7 inline-flex items-center gap-2 text-sm font-black text-primary no-underline"
              >
                About our approach
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[1.6rem] border border-[#e2e7e3] bg-[#e2e7e3] sm:grid-cols-2">
              {platformFeatures.map(({ icon: Icon, title, text }) => (
                <article className="bg-[#fbfcfa] p-7 lg:p-8" key={title}>
                  <span className="grid size-11 place-items-center rounded-xl bg-[#e6f2ed] text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-black leading-snug text-[#20332c]">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-sm font-medium leading-relaxed text-[#6b7772]">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Mentors */}
      <section
        id="mentors"
        className="scroll-mt-24 border-y border-[#e6e9e5] bg-[#f5f2e9] px-6 py-24 max-sm:px-4 max-sm:py-18"
      >
        <motion.div
          className="mx-auto max-w-7xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={reveal}
        >
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>Learn with trusted teachers</SectionLabel>
            <h2 className="text-balance font-display text-[clamp(2.2rem,4vw,3.55rem)] font-black leading-[1.04] tracking-[-0.045em]">
              Scholarship with a human connection.
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-[#68756f]">
              Learn from teachers who bring authentic knowledge, patience, and
              practical guidance into every lesson.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher) => (
              <article
                className="overflow-hidden rounded-[1.5rem] border border-[#dfddd4] bg-white"
                key={teacher.name}
              >
                <div className="aspect-[1.2] overflow-hidden bg-[#deebe6]">
                  <img
                    loading="lazy" decoding="async" width="480" height="400" className="size-full object-cover object-top transition duration-500 hover:scale-[1.03]"
                    src={teacher.image}
                    alt={teacher.name}
                  />
                </div>
                <div className="p-6">
                  <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-primary">
                    {teacher.role}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-black tracking-[-0.025em]">
                    {teacher.name}
                  </h3>
                  <p className="mt-3 text-sm font-bold text-[#78827e]">
                    {teacher.focus}
                  </p>
                  <Link
                    to="/instructors"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#26483f] no-underline"
                  >
                    Meet the instructors
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stories/Testimonials */}
      <section
        id="stories"
        className="scroll-mt-24 bg-white px-6 py-24 max-sm:px-4 max-sm:py-18"
      >
        <motion.div
          className="mx-auto max-w-7xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={reveal}
        >
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <SectionLabel>Learner stories</SectionLabel>
              <h2 className="text-balance font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black leading-[1.04] tracking-[-0.045em]">
                Learning that becomes part of life.
              </h2>
            </div>
            <p className="max-w-md text-sm font-medium leading-relaxed text-[#6b7772]">
              Reflections from learners and educators building a more consistent
              relationship with Islamic knowledge.
            </p>
          </div>

          <div className="home-testimonials mt-8 grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <figure
                className={
                  "flex min-h-[20rem] flex-col justify-between rounded-[1.5rem] p-7 " +
                  (index === 1
                    ? "bg-[#0d6f65] text-white"
                    : "border border-[#e2e7e3] bg-[#f8faf8] text-[#20322c]")
                }
                key={testimonial.name}
              >
                <Quote
                  className={
                    "size-8 " +
                    (index === 1 ? "text-[#f2c75d]" : "text-primary/40")
                  }
                  fill="currentColor"
                />
                <blockquote className="mt-8 text-[1.08rem] font-bold leading-[1.7]">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-8 border-t border-current/10 pt-5">
                  <p className="text-sm font-black">{testimonial.name}</p>
                  <p
                    className={
                      "mt-1 text-xs font-bold " +
                      (index === 1 ? "text-white/60" : "text-[#7a8580]")
                    }
                  >
                    {testimonial.role}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="scroll-mt-24 bg-[#f7f8f5] px-6 py-24 max-sm:px-4 max-sm:py-18"
      >
        <motion.div
          className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={reveal}
        >
          <div>
            <SectionLabel>Common questions</SectionLabel>
            <h2 className="text-balance font-display text-[clamp(2.2rem,3.8vw,3.5rem)] font-black leading-[1.04] tracking-[-0.045em]">
              Everything you need to begin.
            </h2>
            <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-[#68756f]">
              Still deciding where to start? Explore the answers or get in touch
              for personal guidance.
            </p>
            <Link
              to="/contact"
              className="mt-7 inline-flex items-center gap-2 text-sm font-black text-primary no-underline"
            >
              Ask us a question
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="border-t border-[#dfe4df]">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div className="border-b border-[#dfe4df]" key={faq.question}>
                  <button
                    type="button"
                    className="home-faq-trigger flex w-full items-center justify-between gap-6 py-5 text-left"
                    id={`${faqId}-question-${index}`}
                    aria-controls={`${faqId}-answer-${index}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <span className="text-base font-black text-[#24362f]">
                      {faq.question}
                    </span>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#d5ddd8] bg-white text-primary">
                      <ChevronDown
                        className={
                          "size-4 transition-transform duration-200 " +
                          (isOpen ? "rotate-180" : "")
                        }
                      />
                    </span>
                  </button>
                  <div
                    id={`${faqId}-answer-${index}`}
                    role="region"
                    aria-labelledby={`${faqId}-question-${index}`}
                    aria-hidden={!isOpen}
                    inert={!isOpen}
                    className={
                      "home-faq-panel grid transition-[grid-template-rows] duration-300 " +
                      (isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
                    }
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-6 pr-14 text-sm font-medium leading-[1.75] text-[#68756f]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Join */}
      <section
        id="join"
        className="scroll-mt-24 bg-white px-6 py-20 max-sm:px-4 max-sm:py-14"
      >
        <motion.div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#0c6f65] px-7 py-14 text-white sm:px-12 lg:px-16 lg:py-18"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={reveal}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-28 size-[28rem] rounded-full border-[70px] border-white/5"
            aria-hidden="true"
          />
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b8e1d7]">
                Your next lesson can start today
              </p>
              <h2 className="mt-4 text-balance font-display text-[clamp(2.2rem,4vw,3.8rem)] font-black leading-[1.04] tracking-[-0.045em]">
                Build a learning practice that lasts.
              </h2>
              <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/70">
                Explore focused courses, meet trusted teachers, and choose the
                learning path that fits your goals.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f2c65b] px-5 text-sm font-black text-[#17352e] no-underline transition hover:-translate-y-0.5 hover:bg-[#f6d276]"
              >
                Browse courses
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-black text-white no-underline transition hover:bg-white/15"
              >
                Create an account
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default Home;
