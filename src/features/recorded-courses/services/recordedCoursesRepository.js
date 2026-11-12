import courseApi from "@/services/api/courses/courses.api.js";
import { buildRecordedCourseQuery, normalizeRecordedCourseList, normalizeRecordedCourseDetail } from "./recordedCourseContract.js";

// Public retrievals only. Legacy course endpoints remain available to admissions.
const recordedCoursesApi = courseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCoursePolicy: builder.query({
      query: () => "/api/public/course-policy",
      transformResponse: response => {
        const data = response?.data;
        if (typeof data?.version !== "string" || typeof data?.effectiveDate !== "string" || !Array.isArray(data?.sections) || data.sections.some(section => typeof section.id !== "string" || typeof section.title !== "string" || !Array.isArray(section.paragraphs) || section.paragraphs.some(text => typeof text !== "string"))) throw new Error("Invalid course policy response");
        return data;
      },
      keepUnusedDataFor: 300,
    }),
    getRecordedCourses: builder.query({
      query: (args = {}) => ({
        url: "/api/public/recorded-courses",
        params: buildRecordedCourseQuery(args),
      }),
      transformResponse: normalizeRecordedCourseList,
      providesTags: ["Courses"],
      keepUnusedDataFor: 60,
    }),
    getRecordedCourseBySlug: builder.query({
      query: (slug) => `/api/public/recorded-courses/${encodeURIComponent(slug)}`,
      transformResponse: normalizeRecordedCourseDetail,
      providesTags: ["Courses"],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useGetRecordedCoursesQuery, useGetRecordedCourseBySlugQuery, useGetCoursePolicyQuery } = recordedCoursesApi;
