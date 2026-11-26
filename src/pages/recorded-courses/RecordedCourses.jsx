import LoadingState from "@/components/feedback/LoadingState.jsx";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowRight, Atom, BookOpen, ChevronLeft, ChevronRight, Languages, Monitor, Search, Sigma, X } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect.jsx";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import RecordedCourseSkeleton from "@/features/recorded-courses/components/RecordedCourseSkeleton.jsx";
import { useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { recordedCourseLevels, recordedCourseLanguages } from "@/features/recorded-courses/services/recordedCourseContract.js";
import { isFeaturedCatalogue } from "@/lib/course-presentation.js";
import CourseSelection from "@/features/recorded-courses/components/CourseSelection.jsx";
import CourseLearningGuide from "@/features/recorded-courses/components/CourseLearningGuide.jsx";
import CourseSpotlight from "./CourseSpotlight.jsx";
import "./courses-catalogue.css";

// MVP only: subjects announced as coming soon.
const upcomingSubjects = [
  { icon: Monitor, name: "Computer Science" },
  { icon: Languages, name: "English" },
  { icon: Sigma, name: "Mathematics" },
  { icon: Atom, name: "Science" },
];

const PAGE_SIZE = 8;
const levelOptions = recordedCourseLevels.map((value) => ({ value, label: value === "All" ? "All levels" : value }));
const languageOptions = recordedCourseLanguages.map((value) => ({ value, label: value === "All" ? "All languages" : value }));
// Post-MVP: sorting. The API currently returns newest first only; offer sort options once it
// supports more (planned for when the catalogue reaches 10+ courses).
// const sortOptions = [{ value: "newest", label: "Newest" }];

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const RecordedCourses = () => {
  const [params] = useSearchParams();
  // Existing navbar searches, subject links, and bookmarked result pages still work.
  const hasFilters = ["search", "subject", "category", "level", "language", "page"].some(key => params.get(key));
  return isFeaturedCatalogue && !hasFilters ? <FeaturedCourses /> : <FullCourseCatalogue />;
};

// Page header shared by both catalogue modes.
function CoursesHeader({ count, children }) {
  return (
    <section className="courses-hero" aria-labelledby="course-catalogue-title">
      <span className="courses-hero-pattern" aria-hidden="true" />
      <div className="courses-shell">
        <nav className="courses-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Courses</span>
        </nav>
        <h1 id="course-catalogue-title">Explore our courses</h1>
        <p className="courses-hero-lead">Structured video courses taught by qualified teachers. Preview any course, meet your teacher, and learn at your own pace.</p>
        {children}
        <div className="courses-hero-footer">
          <div className="courses-hero-aside">
            {count > 0 && <span className="courses-hero-count">{plural(count, "course")} available</span>}
            <a href="#how-courses-work" className="courses-hero-link">How courses work<ArrowDown size={15} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCourses() {
  const query = useGetRecordedCoursesQuery({ limit: 3 }, { refetchOnMountOrArgChange: 60, refetchOnFocus: true, refetchOnReconnect: true });
  const data = query.currentData;
  // Never silently omit courses if the catalogue outgrows the small selection.
  if (data?.pagination.totalCourses > 3) return <FullCourseCatalogue />;
  const courses = data?.courses || [];
  // One-course launch: the course card sits beside a spotlight panel about that course.
  const single = courses.length === 1 ? courses[0] : null;
  return (
    <main className="courses-page">
      <CoursesHeader count={courses.length} />
      <section className="courses-results" aria-labelledby="featured-courses-title">
        <div className="courses-shell">
          <header className="courses-results-head">
            <div>
              <p className="courses-eyebrow">{single ? "Now enrolling" : "Available now"}</p>
              <h2 id="featured-courses-title">{single ? "Your next course starts here" : "Find your next course"}</h2>
            </div>
            {!single && <p className="courses-results-note">Open a course to see its full lesson outline, your teacher and the price.</p>}
          </header>

          <div className={single ? "courses-single" : undefined}>
            <CourseSelection courses={courses} featured loading={!data && !query.isError} error={query.isError} fetching={query.isFetching} retry={query.refetch} />
            {single && <CourseSpotlight course={single} />}
          </div>
        </div>
      </section>

      {/* MVP: subjects that are coming soon. Replace with real categories once the catalogue grows. */}
      {data && courses.length > 0 && (
        <section className="courses-upcoming" aria-labelledby="courses-upcoming-title">
          <div className="courses-shell">
            <div className="courses-upcoming-head">
              <div>
                <p className="courses-eyebrow">Coming soon</p>
                <h2 id="courses-upcoming-title">More subjects on the way</h2>
                <p>We are preparing new courses. Tell us what you would like to learn next.</p>
              </div>
              <Link to="/contact" className="courses-upcoming-link">Suggest a course<ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <ul className="courses-upcoming-list">
              {upcomingSubjects.map(({ icon: Icon, name }) => (
                <li key={name}>
                  <span className="courses-upcoming-icon"><Icon size={22} aria-hidden="true" /></span>
                  <strong>{name}</strong>
                  <span className="courses-upcoming-status">Coming soon</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <CourseLearningGuide />
    </main>
  );
}

const FullCourseCatalogue = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const categoryParam = (searchParams.get("subject") || searchParams.get("category") || "").trim().toLowerCase();
  const category = !categoryParam || categoryParam === "all" ? "All" : categoryParam;
  const level = recordedCourseLevels.find((value) => value.toLowerCase() === searchParams.get("level")?.toLowerCase()) || "All";
  const language = searchParams.get("language") || "All";
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [categories, setCategories] = useState({});
  const resultsRef = useRef(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const { data, currentData, isFetching, isError, refetch } = useGetRecordedCoursesQuery({
    page, limit: PAGE_SIZE, search: debouncedSearch, category, level, language,
  }, { skip: search !== debouncedSearch, refetchOnMountOrArgChange: 60, refetchOnFocus: true, refetchOnReconnect: true });
  const isLoading = isFetching || search !== debouncedSearch;
  const hasError = isError && !isLoading;
  // Retain the last page while a replacement request runs, avoiding layout collapse.
  const displayedData = currentData || data;
  const visibleCourses = displayedData?.courses || [];
  const totalCourses = displayedData?.pagination.totalCourses ?? 0;
  const pageCount = displayedData?.pagination.totalPages ?? 0;
  const currentPage = displayedData?.pagination.page ?? page;
  useEffect(() => {
    if (!currentData) return;
    setCategories((previous) => ({ ...previous, ...Object.fromEntries(currentData.courses
      .filter((course) => course.categorySlug)
      .map((course) => [course.categorySlug, course.category])) }));
  }, [currentData]);
  const categoryOptions = [{ value: "All", label: "All subjects" }, ...Object.entries({
    ...categories, ...(category !== "All" && { [category]: categories[category] || category }),
  }).map(([value, label]) => ({ value, label }))];
  useEffect(() => {
    if (!currentData || isFetching || page <= Math.max(1, pageCount)) return;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("page", String(Math.max(1, pageCount)));
      return next;
    }, { replace: true });
  }, [currentData, isFetching, page, pageCount, setSearchParams]);

  const updateFilter = (key, value, fallback = "") =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value === fallback || !value) next.delete(key);
        else next.set(key, value);
        next.delete("page");
        next.delete("sort");
        if (key === "subject") next.delete("category");
        return next;
      },
      { replace: key === "search" },
    );

  const setSearch = (value) => updateFilter("search", value);
  const setCategory = (value) => updateFilter("subject", value, "All");
  const setLevel = (value) => updateFilter("level", value, "All");
  const setLanguage = (value) => updateFilter("language", value, "All");

  const setPage = (updater) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("page", String(updater(currentPage)));
      return next;
    });
    // Pagination returns to the results, never the page header. Filters stay put.
    const results = resultsRef.current;
    if (results?.getBoundingClientRect().top < 0) {
      results.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
    results?.focus({ preventScroll: true });
  };

  const hasActiveFilters = search || category !== "All" || level !== "All" || language !== "All";
  const clearFilters = () => setSearchParams({});

  return (
    <main className="courses-page">
      <CoursesHeader count={hasActiveFilters ? 0 : totalCourses}>
        <label className="courses-search">
          <span className="sr-only">Search courses</span>
          <Search size={19} aria-hidden="true" />
          <input
            name="search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
            placeholder="Search for a course or topic"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16} aria-hidden="true" /></button>
          )}
        </label>
      </CoursesHeader>

      <section id="self-paced-catalog" className="courses-results courses-results--full" aria-labelledby="catalogue-results-title">
        <div className="courses-shell">
          <h2 id="catalogue-results-title" className="sr-only">Course results</h2>

          <div className="courses-toolbar">
            <div className="courses-subjects" role="group" aria-label="Filter by subject">
              {categoryOptions.map((item) => (
                <button type="button" key={item.value} onClick={() => setCategory(item.value)} aria-pressed={category === item.value}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="courses-filters">
              <CustomSelect className="courses-filter" menuAlign="right" label="Level" value={level} options={levelOptions} onChange={setLevel} />
              <CustomSelect
                className="courses-filter"
                menuAlign="right"
                label="Language"
                value={language}
                options={languageOptions.some((item) => item.value === language) ? languageOptions : [...languageOptions, { value: language, label: language }]}
                onChange={setLanguage}
              />
              {/* Post-MVP: sorting (see sortOptions above).
              <CustomSelect className="courses-filter" menuAlign="right" label="Sort" value="newest" options={sortOptions} onChange={() => {}} />
              */}
            </div>
          </div>

          <div className="courses-results-bar">
            {isLoading ? <LoadingState variant="inline" label={displayedData ? "Updating courses..." : "Loading courses..."} /> : (
              <p aria-live="polite" aria-atomic="true">Showing {hasError ? 0 : visibleCourses.length} of {hasError ? 0 : totalCourses} courses</p>
            )}
            {hasActiveFilters && <button type="button" onClick={clearFilters} className="courses-clear"><X size={14} aria-hidden="true" />Clear filters</button>}
          </div>

          <div ref={resultsRef} tabIndex={-1} aria-label="Course results" aria-busy={isLoading} data-scroll-pending={isLoading ? "true" : undefined} className="courses-results-region">
            {isLoading && !displayedData ? (
              <div className="courses-grid">
                {Array.from({ length: 6 }, (_, index) => <RecordedCourseSkeleton key={index} />)}
              </div>
            ) : hasError ? (
              <div role="alert" className="courses-state courses-state--error">
                <h3>We couldn’t load courses</h3>
                <p>Please check your connection and try again.</p>
                <button type="button" onClick={refetch} className="cw-button">Try again</button>
              </div>
            ) : visibleCourses.length ? (
              <div inert={isLoading ? true : undefined} className={`courses-grid${isLoading ? " is-updating" : ""}`}>
                {visibleCourses.map((course) => <RecordedCourseCard key={course.id} course={course} />)}
              </div>
            ) : isLoading ? <LoadingState label="Updating courses..." /> : (
              <div className="courses-state">
                <span className="courses-state-icon"><BookOpen size={22} aria-hidden="true" /></span>
                <h3>{hasActiveFilters ? "No courses match your search" : "No courses available yet"}</h3>
                <p>{hasActiveFilters ? "Try different words or remove a filter to see more courses." : "New courses are on the way. Check back soon."}</p>
                <button type="button" onClick={hasActiveFilters ? clearFilters : refetch} className="cw-button">
                  {hasActiveFilters ? "Clear filters" : "Refresh courses"}
                </button>
              </div>
            )}
          </div>

          {!hasError && pageCount > 1 && (
            <nav className="courses-pagination" aria-label="Course pages">
              <button type="button" disabled={isLoading || currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft size={16} aria-hidden="true" />Previous
              </button>
              <span>Page {currentPage} of {pageCount}</span>
              <button type="button" disabled={isLoading || currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                Next<ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </section>

      <CourseLearningGuide />
    </main>
  );
};
export default RecordedCourses;
