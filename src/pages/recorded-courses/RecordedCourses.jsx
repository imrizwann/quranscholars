import LoadingState from "@/components/feedback/LoadingState.jsx";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Grid3X3,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect.jsx";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import RecordedCourseSkeleton from "@/features/recorded-courses/components/RecordedCourseSkeleton.jsx";
import UrduCompanion from "@/components/marketing/UrduCompanion.jsx";
import { useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { recordedCourseLevels, recordedCourseLanguages } from "@/features/recorded-courses/services/recordedCourseContract.js";
const PAGE_SIZE = 8;
const levelOptions = recordedCourseLevels.map((value) => ({ value, label: value === "All" ? "All levels" : value }));
const languageOptions = recordedCourseLanguages.map((value) => ({ value, label: value === "All" ? "All languages" : value }));
const sortOptions = [{ value: "newest", label: "Newest" }];

const RecordedCourses = () => {
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
    <main className="bg-[#fbfcfa] text-[#172b24]">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#082f2b] px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(circle_at_82%_18%,rgba(122,198,176,.28),transparent_27%),radial-gradient(circle_at_15%_80%,rgba(244,201,93,.12),transparent_25%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,.72fr)] lg:items-center lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#9ed6c8]">
              <Sparkles className="size-4 text-[#f4c95d]" />
              On-demand learning
            </div>
            <h1 className="mt-5 max-w-4xl text-balance font-display text-[clamp(2.65rem,5.5vw,5rem)] font-black leading-[1.02] tracking-[-0.045em]">
              Video courses. Learn at your own pace.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/70 sm:text-lg">
              Explore instructor-created courses in Quran, Tajweed, Arabic, and
              Islamic studies. Review what each course covers, explore its
              lesson outline, and choose the right starting point for your
              learning.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#self-paced-catalog"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#f4c95d] px-5 text-sm font-black text-[#11342e] no-underline transition hover:bg-[#ffda79]"
              >
                Browse courses <ArrowRight className="size-4" />
              </a>
              <a
                href="#how-courses-work"
                className="inline-flex min-h-12 items-center rounded-lg border border-white/20 px-5 text-sm font-black text-white no-underline"
              >
                How courses work
              </a>
            </div>
          </div>
          <UrduCompanion
            title="اپنی رفتار سے، اپنے وقت کے مطابق دینی تعلیم حاصل کریں"
            description="قرآن، تجوید، عربی اور اسلامی علوم کے ویڈیو کورسز اپنی رفتار سے پڑھیں۔ داخلہ لینے سے پہلے اسباق، استاد، قیمت اور کورس کی تفصیلات دیکھیں۔"
          />
        </div>
      </section>

      <section
        id="self-paced-catalog"
        className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-18"
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
              <label className="relative min-w-0 flex-1 md:max-w-2xl">
                <span className="sr-only">Search video courses</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#718078]" />
                <input
                  className="h-11 w-full rounded-lg border border-[#d8e1dc] bg-white py-2 pl-10 pr-11 text-sm font-semibold text-[#20332c] outline-none transition placeholder:font-medium placeholder:text-[#95a19c] hover:border-[#bdccc5] focus:border-primary focus:ring-3 focus:ring-primary/10"
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
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <div inert={isLoading ? true : undefined} className={`mt-8 grid gap-6 transition-opacity motion-reduce:transition-none sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isLoading ? "opacity-50" : "opacity-100"}`}>
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

      <section
        id="how-courses-work"
        aria-labelledby="how-courses-title"
        className="scroll-mt-24 border-t border-[#dfe6e2] bg-white px-4 py-14 sm:px-6"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
            Your learning journey
          </p>
          <h2
            id="how-courses-title"
            className="mt-2 font-display text-3xl font-black"
          >
            How courses work
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              [
                "Choose your subject",
                "Browse by subject and level to find a course that fits your interests and experience.",
              ],
              [
                "Explore the course",
                "Review the learning outcomes, video lesson outline, instructor, price and access terms before enrolling.",
              ],
              [
                "Learn at your own pace",
                "Follow the recorded lessons in order and revisit topics as you build your understanding.",
              ],
            ].map(([title, description], index) => (
              <li
                key={title}
                className="rounded-xl border border-[#dfe6e2] p-6"
              >
                <span className="text-sm font-black text-primary">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-display text-xl font-black">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#68766f]">
                  {description}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 max-w-3xl space-y-3">
            {[
              [
                "What does a course include?",
                "Each course has its own recorded lesson outline. Check its details for included resources, prerequisites and learning outcomes.",
              ],
              [
                "How long can I access a course?",
                "Review the access terms on the course details page before enrolling. Access duration and pricing depend on the course.",
              ],
              [
                "Where do I continue learning?",
                "Open My Learning from your account to find your enrolled courses and continue your lessons.",
              ],
            ].map(([question, answer]) => (
              <details
                key={question}
                className="rounded-xl border border-[#dfe6e2] p-5"
              >
                <summary className="cursor-pointer font-bold">
                  {question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-[#68766f]">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
export default RecordedCourses;
