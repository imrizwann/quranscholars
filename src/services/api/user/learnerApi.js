import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query.js";
import paymentApi from "./paymentApi.js";

const unwrap = (response) => {
  if (response?.success !== true || !response.data) throw new Error("Invalid learner response");
  return response.data;
};
const learnerApi = createApi({
  reducerPath: "learnerApi", baseQuery: apiBaseQuery, keepUnusedDataFor: 0,
  tagTypes: ["LearnerProfile", "Enrollment"],
  endpoints: builder => ({
    getLearnerProfile: builder.query({
      query: () => ({ url: "/api/learner/profile", timeout: 15_000 }), transformResponse: unwrap, providesTags: ["LearnerProfile"],
    }),
    updateLearnerProfile: builder.mutation({
      query: ({ gender, city, state, country, preferredLanguage }) => ({
        url: "/api/learner/profile", method: "PATCH", body: { gender, city, state, country, preferredLanguage }, timeout: 15_000,
      }),
      transformResponse: unwrap,
      invalidatesTags: result => result ? ["LearnerProfile"] : [],
    }),
    getEnrollment: builder.query({
      query: courseId => ({ url: `/api/learner/enrollments/${encodeURIComponent(courseId)}`, timeout: 15_000 }),
      transformResponse: unwrap, providesTags: (_result, _error, id) => [{ type: "Enrollment", id }],
    }),
    enrollFreeCourse: builder.mutation({
      query: ({ courseId }) => ({ url: "/api/learner/enrollments/free", method: "POST", body: { courseId }, timeout: 30_000 }),
      transformResponse: unwrap,
      invalidatesTags: (result, _error, { courseId }) => result ? [{ type: "Enrollment", id: courseId }] : [],
      async onQueryStarted({ courseId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(paymentApi.util.invalidateTags([{ type: "CourseAccess", id: courseId }, "LearningLibrary"]));
        } catch { /* Keep existing access unchanged on failure. */ }
      },
    }),
  }),
});
export const { useGetLearnerProfileQuery, useUpdateLearnerProfileMutation, useGetEnrollmentQuery, useEnrollFreeCourseMutation } = learnerApi;
export default learnerApi;
