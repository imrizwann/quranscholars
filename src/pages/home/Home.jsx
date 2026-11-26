import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import RecordedCourseSkeleton from "@/features/recorded-courses/components/RecordedCourseSkeleton.jsx";
import CourseSelection from "@/features/recorded-courses/components/CourseSelection.jsx";
import { useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { isFeaturedCatalogue } from "@/lib/course-presentation.js";
import { homeHeroLayout } from "@/lib/home-hero-layout.js";
// Post-MVP sections (see the commented blocks further down):
// import { teachers, testimonials } from "@/data/homeData.js";
// import { liveClasses } from "@/data/lmsData.js";
// import { LiveClassCard } from "@/pages/live-classes/LiveClasses.jsx";
import HomeHero from "./sections/HomeHero.jsx";
import HeroVideoStage from "./sections/hero/HeroVideoStage.jsx";
import HeroLearningPath from "./sections/hero/HeroLearningPath.jsx";
import HeroEditorial from "./sections/hero/HeroEditorial.jsx";
import HomeSubjects from "./sections/HomeSubjects.jsx";
import HomeSteps from "./sections/HomeSteps.jsx";
import HomeCourseOutline from "./sections/HomeCourseOutline.jsx";
import HomeExperience from "./sections/HomeExperience.jsx";
import HomeInstructor from "./sections/HomeInstructor.jsx";
import HomeFaq from "./sections/HomeFaq.jsx";
import HomeCta from "./sections/HomeCta.jsx";
import { Reveal, SectionIntro } from "./sections/HomeShared.jsx";
import "./home.css";
import "./hero-variants.css";

// Hero layouts, chosen by the VITE_HOME_HERO_LAYOUT flag (see src/lib/home-hero-layout.js).
// The full catalogue always uses the current layout.
const HERO_LAYOUTS = { current: HomeHero, video: HeroVideoStage, path: HeroLearningPath, editorial: HeroEditorial };
const Hero = HERO_LAYOUTS[isFeaturedCatalogue ? homeHeroLayout : "current"];

/*
 * Home page.
 * MVP (default): the site launches with one featured course. The page is built around it,
 * and the "More courses" section only appears once a second course is published.
 * Full catalogue (VITE_CATALOGUE_LAYOUT=full): switch on once there are 10+ courses.
 */
export default function Home() {
  const { data, isLoading, isError, refetch } = useGetRecordedCoursesQuery({ limit: 3 });
  const courses = data?.courses || [];
  const featuredCourse = courses.find(course => (isFeaturedCatalogue ? course.featured : course.trailerVideo)) || courses[0];
  const otherCourses = courses.filter(course => course.id !== featuredCourse?.id);

  return (
    <main className="home-page">
      <Hero course={featuredCourse} loading={isLoading} error={isError} retry={refetch} />
      {/* MVP: "coming soon" subjects. In the full catalogue, show real categories instead. */}
      {isFeaturedCatalogue && <HomeSubjects course={featuredCourse} />}
      <HomeSteps />
      {isFeaturedCatalogue && <HomeCourseOutline course={featuredCourse} />}
      <HomeExperience course={featuredCourse} />
      <HomeInstructor course={featuredCourse} />

      {(!isFeaturedCatalogue || otherCourses.length > 0) && (
        <section id="courses" className="home-section home-more" aria-labelledby="home-more-title">
          <div className="home-shell">
            <Reveal className="home-more-head">
              <SectionIntro id="home-more-title" eyebrow={isFeaturedCatalogue ? "More to explore" : "Latest courses"} title={isFeaturedCatalogue ? "More courses from DarsLearn." : "Start now. Learn at your own pace."}>
                Structured video lessons that remember exactly where you left off.
              </SectionIntro>
              <Link to="/courses" className="home-text-link">View all courses<ArrowRight size={16} aria-hidden="true" /></Link>
            </Reveal>

            {isFeaturedCatalogue ? <CourseSelection courses={otherCourses} /> : (
              <div className="home-course-grid" aria-busy={isLoading}>
                {isLoading && <span className="sr-only" role="status">Loading courses</span>}
                {isLoading ? Array.from({ length: 3 }, (_, index) => <RecordedCourseSkeleton key={index} />) : isError ? (
                  <div className="home-course-state" role="alert"><BookOpen size={24} aria-hidden="true" /><div><h3>Courses are temporarily unavailable</h3><p>Please try again in a moment.</p></div><button type="button" onClick={refetch} className="cw-button">Try again</button></div>
                ) : !courses.length ? (
                  <div className="home-course-state" role="status"><BookOpen size={24} aria-hidden="true" /><div><h3>New courses are on the way</h3><p>Contact our team for help finding your next learning opportunity.</p></div><Link to="/contact" className="cw-button">Contact us<ArrowRight size={15} aria-hidden="true" /></Link></div>
                ) : courses.map(course => <RecordedCourseCard key={course.id} course={course} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Post-MVP: Live classes. Restore once the API-backed classroom is available.
      <section className="home-section">
        <div className="home-shell">
          <SectionIntro eyebrow="Instructor-led programs" title="Learn live. Grow with guidance.">
            Follow a schedule, ask questions and build lasting study habits with an instructor and learning community.
          </SectionIntro>
          <Link to="/live-classes" className="home-text-link">Explore live classes<ArrowRight size={16} aria-hidden="true" /></Link>
          <div className="home-course-grid">
            {liveClasses.map(item => <LiveClassCard key={item.id} item={item} />)}
          </div>
        </div>
      </section>
      */}

      {/* Post-MVP: Teachers and learner stories. Restore with real teachers and genuine
          learner feedback (sample content is kept in src/data/homeData.js).
      <section id="mentors" className="home-section">
        <div className="home-shell">
          <SectionIntro eyebrow="Learn with trusted teachers" title="Scholarship with a human connection." align="center">
            Learn from teachers who bring authentic knowledge, patience, and practical guidance into every lesson.
          </SectionIntro>
          <div className="home-course-grid">
            {teachers.map(teacher => (
              <article key={teacher.name}>
                <img src={teacher.image} alt={teacher.name} loading="lazy" />
                <p>{teacher.role}</p><h3>{teacher.name}</h3><p>{teacher.focus}</p>
                <Link to="/instructors">Meet the instructors</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="home-section">
        <div className="home-shell">
          <SectionIntro eyebrow="Learner stories" title="Learning that becomes part of life.">
            Reflections from learners and educators building a more consistent relationship with Islamic knowledge.
          </SectionIntro>
          <div className="home-testimonials home-course-grid">
            {testimonials.map(testimonial => (
              <figure key={testimonial.name}>
                <blockquote>“{testimonial.quote}”</blockquote>
                <figcaption><strong>{testimonial.name}</strong><span>{testimonial.role}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      */}

      <HomeFaq />
      <HomeCta course={featuredCourse} />
    </main>
  );
}
