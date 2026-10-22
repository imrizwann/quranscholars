import { apiBaseQuery } from "../base-query.js";
import { createApi } from "@reduxjs/toolkit/query/react";

const DEFAULT_PAGE_SIZE = 12;

/*
Backend contract for the scalable catalog:
GET /api/courses?page=1&limit=12&search=&category=&sort=
{
  data: Course[],
  pagination: {
    page, limit, total, totalPages, hasNextPage, hasPreviousPage
  },
  filters: { categories: string[] }
}

GET /api/courses/:slug
{ data: Course }
*/

const getNetPrice = (course) =>
  Number(course?.price?.amount || 0) - Number(course?.price?.discount || 0);

const filterLegacyCourses = (courses, queryArgs) => {
  const search = String(queryArgs.search || "")
    .trim()
    .toLowerCase();
  const category = queryArgs.category || "All";
  const sort = queryArgs.sort || "featured";
  let result = [...courses];

  if (search) {
    result = result.filter((course) =>
      [
        course?.title,
        course?.description,
        course?.overview?.description,
        course?.category,
        course?.level,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search),
      ),
    );
  }

  if (category !== "All") {
    result = result.filter((course) => course?.category === category);
  }

  if (sort === "alphabetical") {
    result.sort((a, b) =>
      String(a?.title || "").localeCompare(String(b?.title || ""), undefined, {
        sensitivity: "base",
      }),
    );
  }

  if (sort === "level") {
    const levelOrder = {
      Basic: 1,
      Beginner: 1,
      Intermediate: 2,
      Advanced: 3,
    };

    result.sort(
      (a, b) => (levelOrder[a?.level] || 99) - (levelOrder[b?.level] || 99),
    );
  }

  if (sort === "price-low") {
    result.sort((a, b) => getNetPrice(a) - getNetPrice(b));
  }

  return result;
};

const normalizeCoursesResponse = (response, queryArgs) => {
  const payload =
    response?.data &&
    !Array.isArray(response.data) &&
    (Array.isArray(response.data.courses) ||
      Array.isArray(response.data.data) ||
      response.data.pagination)
      ? response.data
      : response;
  const courses = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.courses)
      ? payload.courses
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
  const serverPagination = payload?.pagination || payload?.meta?.pagination;
  const responseCategories =
    payload?.filters?.categories || payload?.categories;

  if (serverPagination) {
    const page = Number(serverPagination.page || queryArgs.page);
    const limit = Number(serverPagination.limit || queryArgs.limit);
    const total = Number(serverPagination.total || courses.length);
    const totalPages = Number(
      serverPagination.totalPages || Math.max(1, Math.ceil(total / limit)),
    );

    return {
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage:
          serverPagination.hasNextPage !== undefined
            ? Boolean(serverPagination.hasNextPage)
            : page < totalPages,
        hasPreviousPage:
          serverPagination.hasPreviousPage !== undefined
            ? Boolean(serverPagination.hasPreviousPage)
            : page > 1,
      },
      filters: {
        categories: Array.isArray(responseCategories)
          ? responseCategories
          : [
              ...new Set(
                courses.map((course) => course?.category).filter(Boolean),
              ),
            ],
      },
    };
  }

  // Temporary compatibility for the existing unpaginated API. Once the backend
  // returns pagination metadata, filtering and slicing happen entirely server-side.
  const allCategories = [
    ...new Set(courses.map((course) => course?.category).filter(Boolean)),
  ];
  const filteredCourses = filterLegacyCourses(courses, queryArgs);
  const page = queryArgs.page;
  const limit = queryArgs.limit;
  const total = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    data: filteredCourses.slice(start, start + limit),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
    filters: {
      categories: allCategories,
    },
  };
};

const courseApi = createApi({
  reducerPath: "courseApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["Courses"],
  endpoints: (builder) => ({
    getCourses: builder.query({
      query: ({
        page = 1,
        limit = DEFAULT_PAGE_SIZE,
        search = "",
        category = "All",
        sort = "featured",
      } = {}) => ({
        url: "/api/courses",
        params: {
          page,
          limit,
          ...(String(search).trim() && { search: String(search).trim() }),
          ...(category !== "All" && { category }),
          ...(sort !== "featured" && { sort }),
        },
      }),
      transformResponse: (response, _meta, queryArgs = {}) =>
        normalizeCoursesResponse(response, {
          page: Number(queryArgs.page) || 1,
          limit: Number(queryArgs.limit) || DEFAULT_PAGE_SIZE,
          search: queryArgs.search || "",
          category: queryArgs.category || "All",
          sort: queryArgs.sort || "featured",
        }),
      keepUnusedDataFor: 300,
      providesTags: (result) =>
        result
          ? [
              { type: "Courses", id: "LIST" },
              ...result.data.flatMap((course) => {
                const id = course?._id || course?.slug;
                return id ? [{ type: "Courses", id }] : [];
              }),
            ]
          : [{ type: "Courses", id: "LIST" }],
    }),
    getCourseBySlug: builder.query({
      queryFn: async (slug, _queryApi, _extraOptions, baseQuery) => {
        const detailResult = await baseQuery(
          "/api/courses/" + encodeURIComponent(slug),
        );

        if (!detailResult.error) {
          const payload = detailResult.data?.data || detailResult.data;
          return { data: payload?.course || payload };
        }

        if (detailResult.error.status !== 404) {
          return { error: detailResult.error };
        }

        // Remove this fallback after the dedicated slug endpoint is deployed.
        const legacyResult = await baseQuery("/api/courses");
        if (legacyResult.error) return { error: legacyResult.error };

        const legacyPayload = legacyResult.data?.data || legacyResult.data;
        const legacyCourses = Array.isArray(legacyPayload)
          ? legacyPayload
          : Array.isArray(legacyPayload?.courses)
            ? legacyPayload.courses
            : [];
        const course = legacyCourses.find((item) => item?.slug === slug);

        return course
          ? { data: course }
          : {
              error: {
                status: 404,
                data: { message: "Course not found" },
              },
            };
      },
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, slug) => [{ type: "Courses", id: slug }],
    }),
  }),
});

export const { useGetCoursesQuery, useGetCourseBySlugQuery } = courseApi;

export default courseApi;
