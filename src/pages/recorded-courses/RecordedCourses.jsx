import LoadingState from "@/components/feedback/LoadingState.jsx";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Grid3X3,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect.jsx";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import RecordedCourseSkeleton from "@/features/recorded-courses/components/RecordedCourseSkeleton.jsx";
import CatalogueHero from "@/components/marketing/CatalogueHero.jsx";
import { useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { recordedCourseLevels, recordedCourseLanguages } from "@/features/recorded-courses/services/recordedCourseContract.js";
import { isFeaturedCatalogue } from "@/lib/course-presentation.js";
import CourseSelection from "@/features/recorded-courses/components/CourseSelection.jsx";
import CourseLearningGuide from "@/features/recorded-courses/components/CourseLearningGuide.jsx";
const PAGE_SIZE = 8;
const levelOptions = recordedCourseLevels.map((value) => ({ value, label: value === "All" ? "All levels" : value }));
const languageOptions = recordedCourseLanguages.map((value) => ({ value, label: value === "All" ? "All languages" : value }));
const sortOptions = [{ value: "newest", label: "Newest" }];

const RecordedCourses = () => {
  const [params] = useSearchParams();
  // Existing navbar searches, subject links, and bookmarked result pages still work.
  const hasFilters = ["search", "subject", "category", "level", "language", "page"].some(key => params.get(key));
  return isFeaturedCatalogue && !hasFilters ? <FeaturedCourses /> : <FullCourseCatalogue />;
};

function FeaturedCourses() {
  const query = useGetRecordedCoursesQuery({ limit: 3 }, { refetchOnMountOrArgChange: 60, refetchOnFocus: true, refetchOnReconnect: true });
  const data = query.currentData;
  // Never silently omit courses if the catalogue outgrows the small selection.
  if (data?.pagination.totalCourses > 3) return <FullCourseCatalogue />;
  return <main className="catalogue-page bg-[#fbfcfa] text-[#172b24]">
    <CatalogueHero id="course-catalogue-title" eyebrow="Self-paced courses" title="Make time for meaningful learning." description="A clear learning path, thoughtful teaching, and lessons you can return to. Find out what you'll learn before you enroll." icon={BookOpen} highlights={["Video lessons", "Saved progress", "Learn across devices"]}>
      <a href="#how-courses-work">How courses work</a>
    </CatalogueHero>
    <section className="catalogue-results px-4 sm:px-6" aria-labelledby="featured-courses-title">
      <div className="mx-auto max-w-7xl">
        <header className="featured-catalogue-intro"><h2 id="featured-courses-title">{data?.courses.length === 1 ? "Your next course starts here" : "Find your next course"}</h2><p>Meet your instructor, explore the lessons, and review the course preview and price.</p></header>
        <CourseSelection courses={data?.courses || []} featured loading={!data && !query.isError} error={query.isError} fetching={query.isFetching} retry={query.refetch} />
      </div>
    </section>
    <CourseLearningGuide />
  </main>;
}

const FullCourseCatalogue = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const categoryParam = (searchParams.get("subject") || searchParams.get("category") || "").trim().toLowerCase();
  const category = !categoryParam || categoryParam === "all" ? "All" : categoryParam;
  const level = recordedCourseLevels.find((value) => value.toLowerCase() === searchParams.get("level")?.toLowerCase()) || "All";
  const language = searchParams.get("language") || "All";
  const sort = "newest";
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
  const categoryOptions = [{ value: "All", label: "All" }, ...Object.entries({
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
    // Pagination returns to the results, never the marketing hero. Filters stay put.
    const results = resultsRef.current;
    if (results?.getBoundingClientRect().top < 0) {
      results.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
    results?.focus({ preventScroll: true });
  };

  const handleSearchChange = (event) => setSearch(event.target.value);
  const selectFilter = (setter) => (nextValue) => setter(nextValue);
  const hasActiveFilters = search || category !== "All" || level !== "All" || language !== "All";

  const clearFilters = () => setSearchParams({});

  return (
    <main className="catalogue-page bg-[#fbfcfa] text-[#172b24]">
      <CatalogueHero id="course-catalogue-title" eyebrow="Self-paced courses" title="Learn at your own pace." description="Explore Quran, Tajweed, Arabic, and Islamic studies. Review course outlines, instructors, and pricing before you enroll." icon={Sparkles} highlights={["Video lessons", "Course previews", "Saved progress"]}>
        {/* Live-class discovery is deferred until after the recorded-course MVP.
        <Link to="/live-classes" className="cw-button">Live classes<ArrowRight size={15} aria-hidden="true" /></Link>
        */}
        <a href="#how-courses-work">How courses work</a>
      </CatalogueHero>

      <section
        id="self-paced-catalog"
        className="catalogue-results scroll-mt-24 px-4 sm:px-6"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                Video course library
              </p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Find your next course
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-[#68766f]">
              {isLoading ? <LoadingState variant="inline" label={displayedData ? "Updating courses..." : "Loading courses..."} /> : (
                <p aria-live="polite" aria-atomic="true"><Grid3X3 className="mr-2 inline size-4 text-primary" />Showing {hasError ? 0 : visibleCourses.length} of {hasError ? 0 : totalCourses} courses</p>
              )}
            </div>
          </div>

          <div className="mt-8 border-y border-[#dfe6e2] py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="qs-search-field relative min-w-0 flex-1 md:max-w-2xl">
                <span className="sr-only">Search video courses</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#718078]" />
                <input name="search"
                  className="h-11 w-full rounded-lg border border-[#d8e1dc] bg-white py-2 pl-10 pr-11 text-sm font-semibold text-[#20332c] outline-none transition placeholder:font-medium placeholder:text-[#95a19c] hover:border-[#bdccc5] focus:border-primary"
                  type="search"
                  value={search}
                  onChange={handleSearchChange}
                  maxLength={100}
                  placeholder="Search course titles, descriptions, or tags"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => selectFilter(setSearch)("")}
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent text-[#75837d] transition hover:bg-[#edf2ef] hover:text-[#243a32]"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </label>
              <CustomSelect
                className="w-full md:ml-auto md:w-52"
                menuAlign="right"
                label="Sort"
                value={sort}
                options={sortOptions}
                disabled
                onChange={() => {}}
              />
            </div>

            <div className="mt-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="shrink-0 text-xs font-extrabold text-[#718078]">
                  Subject:
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {categoryOptions.map((item) => {
                    const isActive = category === item.value;
                    return (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => selectFilter(setCategory)(item.value)}
                        aria-pressed={isActive}
                        className={`min-h-8 shrink-0 rounded-full border px-3.5 text-xs font-extrabold transition ${isActive ? "border-[#174d42] bg-[#174d42] text-white" : "border-transparent text-[#586861] hover:border-[#d7e0dc] hover:bg-white"}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <CustomSelect
                  className="w-full sm:w-48"
                  menuAlign="right"
                  label="Level"
                  value={level}
                  options={levelOptions}
                  onChange={selectFilter(setLevel)}
                />
                <CustomSelect
                  className="w-full sm:w-48"
                  menuAlign="right"
                  label="Language"
                  value={language}
                  options={languageOptions.some((item) => item.value === language) ? languageOptions : [...languageOptions, { value: language, label: language }]}
                  onChange={selectFilter(setLanguage)}
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="min-h-11 shrink-0 border-0 bg-transparent px-2 text-xs font-extrabold text-primary transition hover:text-primary-hover"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          <div ref={resultsRef} tabIndex={-1} aria-label="Course results" aria-busy={isLoading} data-scroll-pending={isLoading ? "true" : undefined} className="scroll-mt-24 outline-none">
          {isLoading && !displayedData ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 8 }, (_, index) => (
                <RecordedCourseSkeleton key={index} />
              ))}
            </div>
          ) : hasError ? (
            <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <h3 className="font-display text-xl font-black text-red-900">
                We could not load courses
              </h3>
              <p className="mt-2 text-sm font-medium text-red-700">
                Please refresh the page or try again shortly.
              </p>
              <button type="button" onClick={refetch} className="mt-4 font-bold text-primary">Try again</button>
            </div>
          ) : visibleCourses.length ? (
            <div inert={isLoading ? true : undefined} className={`mt-8 grid gap-6 transition-opacity motion-reduce:transition-none sm:grid-cols-2 xl:grid-cols-3 ${isLoading ? "opacity-50" : "opacity-100"}`}>
              {visibleCourses.map((course) => (
                <RecordedCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : isLoading ? <LoadingState label="Updating courses..." /> : (
            <div className="mt-8 rounded-2xl border border-dashed border-[#cbd8d1] bg-white p-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#e8f4f0] text-primary">
                <BookOpen className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-black">
                {hasActiveFilters ? "No courses match those filters" : "No courses available yet"}
              </h3>
              <p className="mt-2 text-sm font-medium text-[#718079]">
                {hasActiveFilters ? "Try a broader search or clear the selected filters." : "Check again soon for new courses, or refresh to see the latest catalogue."}
              </p>
              <button
                type="button"
                onClick={hasActiveFilters ? clearFilters : refetch}
                className="mt-5 min-h-10 rounded-lg border border-[#cfd9d4] bg-white px-4 text-sm font-black text-primary transition hover:bg-[#f1f7f4]"
              >
                {hasActiveFilters ? "Clear filters" : "Refresh courses"}
              </button>
            </div>
          )}

          </div>
          {!hasError && pageCount > 1 && (
            <nav
              className="mt-10 flex items-center justify-center gap-2"
              aria-label="Course pages"
            >
              <button
                type="button"
                disabled={isLoading || currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="min-h-10 rounded-lg border border-[#d5ded9] bg-white px-4 text-sm font-black text-[#43554d] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Previous
              </button>
              <span className="px-2 text-sm font-bold text-[#68766f]">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                disabled={isLoading || currentPage >= pageCount}
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
                className="min-h-10 rounded-lg border border-[#d5ded9] bg-white px-4 text-sm font-black text-[#43554d] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
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
