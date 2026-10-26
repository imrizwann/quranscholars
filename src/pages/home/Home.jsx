import LoadingState from "@/components/feedback/LoadingState.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import video from "../../assets/videos/13029950-hd_1920_1080_24fps.mp4";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  Headphones,
  Play,
  Quote,
  ShieldCheck,
} from "lucide-react";
import heroWomanTransparent from "@/assets/images/hero-woman-transparent.svg";

import {
  showcaseStats,
  showcasePath,
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
import VideoPlayer from "@/components/video-player/VideoPlayer";



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
  const [openFaq, setOpenFaq] = useState(0);
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
    <main className="overflow-hidden bg-[#fbfcfa] text-[#14231e] z-0">
      {/* Showcase */}
      <section
        id="main"
        className="relative isolate overflow-hidden bg-[#082f2b] text-white"
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

        <div className="mx-auto grid min-h-[calc(100svh-7.5rem)] w-full max-w-7xl content-start gap-10 px-6 pb-18 pt-14 lg:min-h-[640px] lg:grid-cols-[minmax(0,0.94fr)_minmax(22rem,0.66fr)] lg:content-center lg:items-end lg:pb-16 lg:pt-18 max-sm:min-h-[calc(100svh-6rem)] max-sm:px-4 max-sm:pb-12 max-sm:pt-9">
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
              className="mb-5 inline-flex max-w-full items-center gap-2 rounded-md border border-white/[.18] bg-white/[.09] px-3.5 py-2 text-[0.68rem] font-black uppercase tracking-[0.15em] text-[#d6efe8] shadow-sm backdrop-blur max-sm:text-[0.6rem] max-sm:tracking-[0.1em]"
            >
              <ShieldCheck className="size-3.5 text-[#f4c95d]" />
              Trusted Islamic LMS for every learning rhythm
            </motion.div>

            <motion.h1
              id="home-hero-title"
              variants={reveal}
              className="max-w-196 text-balance font-display text-[clamp(3rem,6.6vw,6.1rem)] font-black leading-[0.96] tracking-normal text-white max-sm:text-[2.48rem] max-sm:leading-[1.04]"
            >
              <span>IQRA</span> <span className="text-[#f4c95d]">ILM</span>{" "}
              <span className="">DEEN</span>
              {/* <span className="text-[#f4c95d] ml-2 opacity-10 absolute top-10 left-[50%]">تَعَلَّمْ وَارْتَقِ</span> */}
            </motion.h1>

            <motion.p
              variants={reveal}
              className="mt-6 max-w-172 text-pretty text-[clamp(1.05rem,1.45vw,1.24rem)] font-medium leading-[1.75] text-white/[.74]"
            >
              Learn Quran, Tajweed, Hadith, Fiqh, and family-focused Islamic
              studies through live scholar-led classes and high-quality
              self-paced courses designed for flexible, structured learning.
            </motion.p>

            <motion.div
              variants={reveal}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/courses"
                className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg bg-[#f4c95d] px-6 text-sm font-black text-[#102f2a] no-underline shadow-[0_16px_38px_rgba(0,0,0,.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffd978] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4c95d]"
              >
                Explore courses
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/live-classes"
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border border-white/[.24] bg-white/10 px-6 text-sm font-black text-white no-underline backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/[.16] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <Headphones className="size-[1.1rem] text-[#9ad8ca]" />
                Join live class
              </Link>
            </motion.div>

            <motion.div
              variants={reveal}
              className="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-lg border border-white/[.12] bg-white/10 backdrop-blur max-sm:grid-cols-1"
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

          <motion.div
            className="relative hidden min-h-136 w-full lg:block"
            initial={{
              opacity: 0,
              x: prefersReducedMotion ? 0 : 24,
            }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.8,
              delay: prefersReducedMotion ? 0 : 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="absolute bottom-0 right-0 hidden w-[min(27rem,100%)] rounded-lg border border-white/[.14] bg-[#061f1c]/[.78] p-4 shadow-[0_30px_70px_rgba(0,0,0,.32)] backdrop-blur-xl lg:block">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-[#9ad8ca]">
                    Course showcase
                  </p>
                  <h2 className="mt-1 text-lg font-black leading-tight">
                    Foundations of Tajweed
                  </h2>
                </div>
                <Link
                  to="/courses/tajweed-foundations-recite-with-confidence"
                  aria-label="Play course preview"
                  className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-[#0f766e] transition hover:scale-105"
                >
                  <Play className="ml-0.5 size-5 fill-current" />
                </Link>
              </div>

              <div className="py-4">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/[.64]">
                  <span>Lesson progress</span>
                  <span>68%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-md bg-white/12">
                  <div className="h-full w-[68%] rounded-md bg-[#f4c95d]" />
                </div>
              </div>

              <div className="grid gap-3">
                {showcasePath.map(({ icon: Icon, title, text }) => (
                  <div
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[.055] p-3"
                    key={title}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white/10 text-[#f4c95d]">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">{title}</p>
                      <p className="mt-0.5 text-xs font-semibold text-white/[.56]">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute right-0 top-4 hidden w-[17.5rem] rounded-lg border border-white/[.16] bg-white p-3.5 text-[#17332d] shadow-[0_18px_48px_rgba(0,0,0,.22)] lg:flex lg:items-center lg:gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-[#e8f4f0] text-primary">
                <CalendarCheck className="size-5" />
              </span>
              <div>
                <p className="text-xs font-black">Next live class</p>
                <p className="mt-0.5 text-[0.68rem] font-bold text-[#6b7772]">
                  Quran recitation with teacher feedback
                </p>
              </div>
            </div>
          </motion.div>
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

          {coursesLoading && <LoadingState variant="inline" label="Loading courses..." className="mt-6" />}
          <div className="mt-12 grid gap-6 lg:grid-cols-3" aria-busy={coursesLoading}>
            {coursesLoading ? Array.from({ length: 3 }, (_, index) => <RecordedCourseSkeleton key={index} />) : coursesError ? (
              <p className="text-sm text-[#66736e]" role="alert">Courses could not be loaded. <button type="button" onClick={retryCourses} className="font-bold text-primary">Try again</button></p>
            ) : !homeRecordedCourses.length ? <p className="text-sm text-[#66736e]">No courses are available yet.</p> : homeRecordedCourses.map((course) => (
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
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
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
              A complete video processing pipeline works quietly in the
              background, so learners experience reliable playback, clear lesson
              structure, and a smooth return to where they left off.
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
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#092f2b] shadow-[0_35px_90px_rgba(0,0,0,.28)]">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
                <span className="size-2.5 rounded-full bg-[#ef6b63]" />
                <span className="size-2.5 rounded-full bg-[#e9bd4f]" />
                <span className="size-2.5 rounded-full bg-[#78c6a4]" />
                <span className="ml-3 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white/38">
                  Course player
                </span>
              </div>

              <div className="aspect-video">
                {/* Video Player */}
                <VideoPlayer src={video} className="qs-video-player--embedded" />
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[#8ecdbd]">
                    Section 2 · Lesson 4
                  </p>
                  <h3 className="mt-2 font-display text-lg font-black">
                    Understanding the rules of Madd
                  </h3>
                </div>
                <Link
                  to="/courses/tajweed-foundations-recite-with-confidence"
                  className="rounded-xl bg-white px-4 py-2.5 text-center text-xs font-black text-[#133a33] no-underline"
                >
                  Next lesson
                </Link>
              </div>
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

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {teachers.map((teacher) => (
              <article
                className="overflow-hidden rounded-[1.5rem] border border-[#dfddd4] bg-white"
                key={teacher.name}
              >
                <div className="aspect-[1.2] overflow-hidden bg-[#deebe6]">
                  <img
                    className="size-full object-cover object-top transition duration-500 hover:scale-[1.03]"
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
                    to="/register"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#26483f] no-underline"
                  >
                    Learn with this mentor
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

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
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
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
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
                    className={
                      "grid transition-[grid-template-rows] duration-300 " +
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
