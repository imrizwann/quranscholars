import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  LoaderCircle,
  MonitorPlay,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Course from "@/features/courses/components/Course.jsx";
import { useGetCoursesQuery } from "@/services/api/courses/courses.api.js";
import ServiceBreadcrumb from "@/components/navigation/ServiceBreadcrumb.jsx";
import CustomSelect from "@/components/ui/CustomSelect.jsx";
import useDebouncedValue from "@/hooks/useDebouncedValue.js";

const PAGE_SIZE = 12;
const sortOptions = [
  {
    value: "featured",
    label: "Featured",
    description: "Recommended courses first",
  },
  {
    value: "alphabetical",
    label: "Title: A–Z",
    description: "Browse alphabetically",
  },
  {
    value: "level",
    label: "Level",
    description: "Foundation to advanced",
  },
  {
    value: "price-low",
    label: "Price: low to high",
    description: "Lowest course fee first",
  },
];

const getPageNumber = (value) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

const getPageWindow = (currentPage, totalPages) => {
  const length = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - length + 1));
  return Array.from({ length }, (_, index) => start + index);
};

const CourseSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-[#e1e7e3] bg-white shadow-[0_10px_30px_rgba(18,48,40,.05)]">
    <div className="aspect-16/10 animate-pulse bg-[#e8efeb]" />
    <div className="space-y-4 p-5">
      <div className="h-3 w-24 animate-pulse rounded-full bg-[#e3eae6]" />
      <div className="h-6 w-4/5 animate-pulse rounded-md bg-[#e3eae6]" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-[#edf1ef]" />
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-[#edf1ef]" />
      </div>
      <div className="h-11 animate-pulse rounded-xl bg-[#e8efeb]" />
    </div>
  </div>
);

const Courses = () => {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const incomingSearch = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "All";
  const selectedSort = searchParams.get("sort") || "featured";
  const requestedPage = getPageNumber(searchParams.get("page"));
  const isServicesView = pathname.startsWith("/services");
  const catalogRef = useRef();
  const searchInputChangedRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState(incomingSearch);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const queryArgs = useMemo(
    () => ({
      page: requestedPage,
      limit: PAGE_SIZE,
      search: incomingSearch,
      category: selectedCategory,
      sort: selectedSort,
    }),
    [incomingSearch, requestedPage, selectedCategory, selectedSort],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useGetCoursesQuery(queryArgs);
  const courses = data?.data || [];
  const pagination = data?.pagination || {
    page: requestedPage,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: requestedPage > 1,
  };
  const availableCategories = (data?.filters?.categories || []).filter(
    (item) => item && item !== "All",
  );
  const categories = ["All", ...availableCategories];
  const pageWindow = getPageWindow(pagination.page, pagination.totalPages);

  useEffect(() => {
    if (searchInputChangedRef.current) return;
    setSearchTerm(incomingSearch);
  }, [incomingSearch]);

  useEffect(() => {
    if (!searchInputChangedRef.current) return;
    searchInputChangedRef.current = false;

    if (debouncedSearch === incomingSearch) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    if (debouncedSearch.trim()) {
      nextSearchParams.set("search", debouncedSearch.trim());
    } else {
      nextSearchParams.delete("search");
    }
    nextSearchParams.delete("page");
    setSearchParams(nextSearchParams, { replace: true });
  }, [debouncedSearch, incomingSearch, searchParams, setSearchParams]);

  useEffect(() => {
    if (
      isFetching ||
      requestedPage <= pagination.totalPages ||
      pagination.totalPages < 1
    ) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    if (pagination.totalPages > 1) {
      nextSearchParams.set("page", String(pagination.totalPages));
    } else {
      nextSearchParams.delete("page");
    }
    setSearchParams(nextSearchParams, { replace: true });
  }, [
    isFetching,
    pagination.totalPages,
    requestedPage,
    searchParams,
    setSearchParams,
  ]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) || selectedCategory !== "All";
  const categoryCount = availableCategories.length;

  const updateCatalogParams = (updates, options = {}) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "All" ||
        value === "featured" ||
        (key === "page" && Number(value) === 1)
      ) {
        nextSearchParams.delete(key);
      } else {
        nextSearchParams.set(key, String(value));
      }
    });

    setSearchParams(nextSearchParams, {
      replace: options.replace ?? false,
    });
  };

  const clearSearch = () => {
    searchInputChangedRef.current = false;
    setSearchTerm("");
    updateCatalogParams({ search: "", page: 1 }, { replace: true });
  };

  const clearFilters = () => {
    searchInputChangedRef.current = false;
    setSearchTerm("");
    updateCatalogParams(
      { search: "", category: "All", page: 1 },
      { replace: true },
    );
  };

  const handleSearchChange = (event) => {
    searchInputChangedRef.current = true;
    setSearchTerm(event.target.value);
  };

  const selectCategory = (category) => {
    updateCatalogParams({ category, page: 1 });
  };

  const selectSort = (sort) => {
    updateCatalogParams({ sort, page: 1 });
  };

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.page) {
      return;
    }

    updateCatalogParams({ page });
    window.requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const reveal = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.55,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#172a23]">
      {isServicesView && (
        <div className="border-b border-[#e2e8e4] bg-white">
          <div className="mx-auto max-w-7xl px-6 max-sm:px-4">
            <ServiceBreadcrumb currentLabel="Courses" />
          </div>
        </div>
      )}

      <section
        className="relative isolate overflow-hidden bg-[#082f2b] text-white"
        aria-labelledby="course-library-title"
      >
        <div
          className="absolute inset-0 -z-30 bg-[linear-gradient(120deg,#061f1c_0%,#0a4840_58%,#0e3a34_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute -right-28 -top-48 -z-20 size-160 rounded-full border-96 border-white/[.035]"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-48 left-[34%] -z-20 size-120 rounded-full bg-[#3e9d88]/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="mx-auto grid min-h-124 w-full max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.08fr_.72fr] lg:py-20 max-sm:px-4 max-sm:py-12">
          <motion.div initial="hidden" animate="visible" variants={reveal}>
            {!isServicesView && (
              <nav
                className="mb-7 flex items-center gap-2 text-xs font-bold text-white/55"
                aria-label="Breadcrumb"
              >
                <Link
                  className="text-white/70 no-underline hover:text-white"
                  to="/"
                >
                  Home
                </Link>
                <span aria-hidden="true">/</span>
                <Link
                  className="text-white/70 no-underline hover:text-white"
                  to="/courses"
                >
                  Courses
                </Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Live classes</span>
              </nav>
            )}

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3.5 py-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#b7e2d7] backdrop-blur">
              <Sparkles className="size-3.5 text-[#f4c95d]" />
              Live · Instructor-led learning
            </div>

            <h1
              id="course-library-title"
              className="mt-6 max-w-3xl text-balance font-display text-[clamp(2.7rem,5vw,4.8rem)] font-black leading-[1.02] tracking-[-0.045em]"
            >
              Learn with clarity.{" "}
              <span className="text-[#f4c95d]">Grow with purpose.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base font-medium leading-[1.8] text-white/70 sm:text-lg">
              Join focused Quran and Islamic studies courses with live teacher
              guidance, accountable progress, and the existing admission pathway.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-0 bg-[#f4c95d] px-5 text-sm font-black text-[#14352e] shadow-[0_14px_34px_rgba(0,0,0,.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffda77]"
                type="button"
                onClick={scrollToCatalog}
              >
                Explore live classes
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/[.08] px-5 text-sm font-black text-white no-underline backdrop-blur transition duration-200 hover:bg-white/[.14]"
                to="/contact"
              >
                Get learning guidance
              </Link>
            </div>

            <dl className="mt-10 grid max-w-2xl grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-black/10 backdrop-blur max-sm:grid-cols-1">
              <div className="p-4 max-sm:border-b max-sm:border-white/10 sm:border-r sm:border-white/10">
                <dt className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/45">
                  Courses
                </dt>
                <dd className="mt-1.5 text-xl font-black text-white">
                  {isLoading ? "—" : pagination.total}
                </dd>
              </div>
              <div className="p-4 max-sm:border-b max-sm:border-white/10 sm:border-r sm:border-white/10">
                <dt className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/45">
                  Subjects
                </dt>
                <dd className="mt-1.5 text-xl font-black text-white">
                  {isLoading ? "—" : categoryCount}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/45">
                  Learning format
                </dt>
                <dd className="mt-1.5 text-xl font-black text-white">Instructor-led</dd>
              </div>
            </dl>
          </motion.div>

          <motion.aside
            className="relative hidden overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[.09] p-7 shadow-[0_28px_70px_rgba(0,0,0,.22)] backdrop-blur-xl lg:block"
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.65,
              delay: 0.12,
            }}
          >
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#a9d8cd]">
              A better way to learn
            </p>
            <h2 className="mt-3 text-2xl font-black leading-tight">
              A focused path from intention to understanding.
            </h2>

            <div className="mt-7 grid gap-3">
              {[
                {
                  icon: BadgeCheck,
                  title: "Trusted instruction",
                  text: "Study with structured, scholar-guided material.",
                },
                {
                  icon: MonitorPlay,
                  title: "Flexible access",
                  text: "Join live classes with session replays when included.",
                },
                {
                  icon: BookOpenCheck,
                  title: "Clear progression",
                  text: "Move through purposeful lessons at a steady pace.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  className="flex gap-4 rounded-xl border border-white/10 bg-[#062722]/60 p-4"
                  key={title}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f4c95d] text-[#173a32]">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black">{title}</h3>
                    <p className="mt-1 text-xs font-medium leading-5 text-white/58">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </section>

      <section
        ref={catalogRef}
        id="course-catalog"
        className="scroll-mt-24 px-6 py-14 lg:py-18 max-sm:px-4"
        aria-labelledby="catalog-title"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                Course catalog
              </p>
              <h2
                id="catalog-title"
                className="mt-2 font-display text-[clamp(2rem,3vw,3rem)] font-black tracking-[-0.035em] text-[#172a23]"
              >
                Find the right learning path
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#68756f] sm:text-base">
                Search by topic, compare levels, and choose a course that matches
                your goals.
              </p>
            </div>
            <div
              className="inline-flex items-center gap-2 text-sm font-bold text-[#68756f]"
              aria-live="polite"
            >
              {isFetching && !isLoading ? (
                <LoaderCircle className="size-4 animate-spin text-primary" />
              ) : (
                <Grid3X3 className="size-4 text-primary" />
              )}
              Showing {courses.length} of {pagination.total} courses
            </div>
          </div>

          <div className="mt-8 border-y border-[#dfe6e2] py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="qs-search-field relative min-w-0 flex-1 md:max-w-2xl">
                <span className="sr-only">Search the course catalog</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#718078]" />
                <input name="search"
                  className="h-11 w-full rounded-lg border border-[#d8e1dc] bg-white py-2 pl-10 pr-11 text-sm font-semibold text-[#20332c] outline-none transition placeholder:font-medium placeholder:text-[#95a19c] hover:border-[#bdccc5] focus:border-primary"
                  type="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search courses and subjects"
                />
                {searchTerm && (
                  <button
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent text-[#75837d] transition hover:bg-[#edf2ef] hover:text-[#243a32]"
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </label>

              <CustomSelect
                className="w-full md:ml-auto md:w-60"
                menuAlign="right"
                label="Sort"
                value={selectedSort}
                options={sortOptions}
                onChange={selectSort}
              />
            </div>

            <div className="mt-4 flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-xs font-extrabold text-[#718078]">
                Subject:
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((item) => {
                  const isActive = selectedCategory === item;
                  return (
                    <button
                      className={
                        "min-h-8 shrink-0 rounded-full border px-3.5 text-xs font-extrabold transition " +
                        (isActive
                          ? "border-[#174d42] bg-[#174d42] text-white"
                          : "border-transparent text-[#586861] hover:border-[#d7e0dc] hover:bg-white")
                      }
                      type="button"
                      key={item}
                      onClick={() => selectCategory(item)}
                      aria-pressed={isActive}
                    >
                      {item === "All" ? "All" : item}
                    </button>
                  );
                })}
              </div>
              {hasActiveFilters && (
                <button
                  className="hidden shrink-0 border-0 bg-transparent text-xs font-extrabold text-primary hover:text-primary-hover sm:inline"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {isLoading && (
            <div
              className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              aria-label="Loading courses"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <CourseSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div className="mt-8 rounded-2xl border border-[#ead8d2] bg-white px-6 py-16 text-center shadow-sm">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#fff0eb] text-[#a8432f]">
                <X className="size-5" />
              </span>
              <h3 className="mt-5 text-xl font-black text-[#263a32]">
                We couldn’t load the course catalog
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#718079]">
                Please check your connection and try again. Your filters will stay
                ready.
              </p>
              <button
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border-0 bg-primary px-5 text-sm font-black text-white hover:bg-primary-hover"
                type="button"
                onClick={refetch}
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !isError && courses.length > 0 && (
            <motion.div
              className={
                "mt-8 grid gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 " +
                (isFetching ? "opacity-60" : "opacity-100")
              }
              aria-busy={isFetching}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: shouldReduceMotion ? 1 : 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: shouldReduceMotion ? 0 : 0.06,
                  },
                },
              }}
            >
              {courses.map((course, index) => (
                <Course
                  key={course?._id || course?.slug || index}
                  course={course}
                />
              ))}
            </motion.div>
          )}

          {!isLoading &&
            !isError &&
            courses.length > 0 &&
            pagination.totalPages > 1 && (
              <nav
                className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#dfe6e2] pt-6 sm:flex-row"
                aria-label="Course catalog pagination"
              >
                <p className="text-sm font-bold text-[#718078]">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#d7e1dc] bg-white px-3 text-xs font-extrabold text-[#40544c] transition hover:border-[#aebfb7] hover:bg-[#f7faf8] disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    disabled={!pagination.hasPreviousPage || isFetching}
                    onClick={() => goToPage(pagination.page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </button>

                  <div className="hidden items-center gap-1.5 sm:flex">
                    {pageWindow.map((page) => {
                      const isCurrentPage = page === pagination.page;
                      return (
                        <button
                          className={
                            "grid size-10 place-items-center rounded-lg border text-xs font-black transition " +
                            (isCurrentPage
                              ? "border-primary bg-primary text-white"
                              : "border-transparent bg-transparent text-[#5f7068] hover:border-[#d7e1dc] hover:bg-white")
                          }
                          type="button"
                          key={page}
                          disabled={isCurrentPage || isFetching}
                          onClick={() => goToPage(page)}
                          aria-current={isCurrentPage ? "page" : undefined}
                          aria-label={"Go to page " + page}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#d7e1dc] bg-white px-3 text-xs font-extrabold text-[#40544c] transition hover:border-[#aebfb7] hover:bg-[#f7faf8] disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    disabled={!pagination.hasNextPage || isFetching}
                    onClick={() => goToPage(pagination.page + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </nav>
            )}

          {!isLoading && !isError && courses.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-[#cfdad5] bg-white px-6 py-18 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e9f3ef] text-primary">
                <Search className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-black text-[#263a32]">
                No courses match your search
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#718079]">
                Try a broader topic or clear the filters to see every available
                learning path.
              </p>
              {hasActiveFilters && (
                <button
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-primary bg-white px-5 text-sm font-black text-primary transition hover:bg-[#edf7f3]"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          <div className="relative mt-16 overflow-hidden rounded-[1.75rem] bg-[#0c6f65] px-7 py-10 text-white shadow-[0_24px_60px_rgba(12,65,57,.16)] sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12">
            <div
              className="absolute -right-20 -top-24 size-72 rounded-full border-[54px] border-white/5"
              aria-hidden="true"
            />
            <div className="relative max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b9e2d8]">
                Personal learning guidance
              </p>
              <h2 className="mt-3 text-balance font-display text-3xl font-black tracking-[-0.03em]">
                Not sure which course fits your goals?
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-white/68 sm:text-base">
                Tell us what you want to learn and we’ll help you choose a clear,
                realistic starting point.
              </p>
            </div>
            <div className="relative mt-7 flex flex-wrap gap-3 lg:mt-0">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f4c95d] px-5 text-sm font-black text-[#15372f] no-underline transition hover:-translate-y-0.5 hover:bg-[#ffda77]"
                to="/contact"
              >
                Talk to an advisor
                <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white no-underline transition hover:bg-white/15"
                to="/services"
              >
                Explore services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Courses;
