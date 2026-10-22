import { liveClasses, demoLiveEnrollments } from "@/data/lmsData.js";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpenCheck, Clock3, PlayCircle } from "lucide-react";
import LearningCourseCard from "@/features/recorded-courses/components/LearningCourseCard.jsx";

const MyLearning = () => {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get("type") === "live-classes" ? "live-classes" : "courses";
  // Await authenticated learner retrievals; public courses are not enrollments.
  const enrolledCourses = [];
  const completedLessons = enrolledCourses.reduce((total, item) => total + (item.enrollment.completedLessonIds?.length || 0), 0);
  const totalLessons = enrolledCourses.reduce((total, item) => total + item.course.totalLessons, 0);


  return (
    <main className="min-h-[70vh] bg-[#fbfcfa] px-4 py-12 text-[#172b24] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 border-b border-[#dfe6e2] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-primary">Student learning area</p><h1 className="mt-2 font-display text-[clamp(2.5rem,5vw,4.2rem)] font-black leading-none tracking-[-0.045em]">My Learning</h1><p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#68766f]">Continue your video courses and find your enrolled live classes in one place.</p></div>
          <Link to="/courses" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-[#ccd8d2] bg-white px-4 text-sm font-black text-primary no-underline transition hover:bg-[#f0f7f4]">Browse courses <ArrowRight className="size-4" /></Link>
        </div>

        <div className="mt-8 flex gap-2" aria-label="Learning type">
          {[["courses", "Courses"], ["live-classes", "Live Classes"]].map(([value, label]) => <button type="button" key={value} aria-pressed={activeTab === value} onClick={() => setParams({ type: value })} className={"min-h-11 rounded-full px-5 text-sm font-bold " + (activeTab === value ? "bg-primary text-white" : "border border-border bg-white")}>{label}</button>)}
        </div>
        {activeTab === "live-classes" ? <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Enrolled live classes">{liveClasses.filter((item) => demoLiveEnrollments.some((enrollment) => enrollment.liveClassId === item.id)).map((item) => <article key={item.id} className="rounded-xl border border-border bg-white p-6"><p className="text-xs font-bold text-primary">Live class</p><h2 className="mt-3 font-display text-2xl font-black">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">with {item.instructor}</p><p className="mt-4 text-sm font-bold">{item.schedule} ? {item.time} ? {item.timezone}</p><Link to={"/classroom/" + item.slug} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-white no-underline">Open classroom <ArrowRight className="size-4" /></Link></article>)}</section> : enrolledCourses.length ? (
          <>
            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#dfe6e2] bg-white p-5"><dt className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-[#718079]"><BookOpenCheck className="size-4 text-primary" />Enrolled</dt><dd className="mt-2 font-display text-3xl font-black">{enrolledCourses.length}</dd></div>
              <div className="rounded-xl border border-[#dfe6e2] bg-white p-5"><dt className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-[#718079]"><PlayCircle className="size-4 text-primary" />Lessons completed</dt><dd className="mt-2 font-display text-3xl font-black">{completedLessons}</dd></div>
              <div className="rounded-xl border border-[#dfe6e2] bg-white p-5"><dt className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-[#718079]"><Clock3 className="size-4 text-primary" />Overall progress</dt><dd className="mt-2 font-display text-3xl font-black">{totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0}%</dd></div>
            </dl>
            <section className="mt-10" aria-labelledby="courses-in-progress"><div className="flex items-center justify-between gap-4"><h2 id="courses-in-progress" className="font-display text-2xl font-black">Courses in progress</h2><span className="text-sm font-bold text-[#718079]">Progress saves on this device for now</span></div><div className="mt-5 grid gap-5">{enrolledCourses.map(({ course, enrollment }) => <LearningCourseCard key={course.id} course={course} enrollment={enrollment} />)}</div></section>
          </>
        ) : (
          <section className="mt-10 rounded-2xl border border-dashed border-[#cbd8d1] bg-white p-10 text-center"><span className="mx-auto grid size-14 place-items-center rounded-xl bg-[#e8f4f0] text-primary"><BookOpenCheck className="size-6" /></span><h2 className="mt-5 font-display text-2xl font-black">Your learning library is coming soon</h2><p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-[#68766f]">Recorded-course enrollment and your learning library are not available yet. You can browse course details now.</p><Link to="/courses" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white no-underline">Find a self-paced course <ArrowRight className="size-4" /></Link></section>
        )}
      </div>
    </main>
  );
};

export default MyLearning;
