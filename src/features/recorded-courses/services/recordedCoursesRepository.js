import courseApi from "@/services/api/courses/courses.api.js";
import { adaptRecordedCourse } from "../model/recordedCourseAdapter.js";
import { buildRecordedCourseQuery, normalizeRecordedCourseList } from "./recordedCourseContract.js";

// Public retrievals only. Legacy course endpoints remain available to admissions.
const recordedCoursesApi = courseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecordedCourses: builder.query({
      query: (args = {}) => ({
        url: "/api/public/recorded-courses",
        params: buildRecordedCourseQuery(args),
      }),
      transformResponse: normalizeRecordedCourseList,
      keepUnusedDataFor: 60,
    }),
    getRecordedCourseBySlug: builder.query({
      query: (slug) => `/api/public/recorded-courses/${encodeURIComponent(slug)}`,
      transformResponse: (response) => {
        if (!response?.data?.course) throw new Error("Invalid course response");
        return adaptRecordedCourse(response.data.course);
      },
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useGetRecordedCoursesQuery, useGetRecordedCourseBySlugQuery } = recordedCoursesApi;
