import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query.js";
import paymentApi from "./paymentApi.js";
import { normalizeRecordedCourseDetail } from "@/features/recorded-courses/services/recordedCourseContract.js";

const unwrap = (response) => {
  if (response?.success !== true || !response.data) throw new Error("Invalid learner response");
  return response.data;
};
const learnerApi = createApi({
  reducerPath: "learnerApi", baseQuery: apiBaseQuery, keepUnusedDataFor: 0,
  tagTypes: ["LearnerProfile", "Enrollment", "LearningProgress", "SectionQuiz", "LearnerAnalytics", "LearningCourse"],
  endpoints: builder => ({
    updateLearningLibrary: builder.mutation({
      query: ({ courseId, action, confirmationTitle }) => ({ url: `/api/learner/enrollments/${encodeURIComponent(courseId)}`, method: "PATCH", body: { action, ...(action === "leave" && { confirmationTitle }) }, timeout: 20_000 }),
      transformResponse: unwrap,
      invalidatesTags: (result, _error, { courseId, action }) => result && action === "leave" ? [{ type: "Enrollment", id: courseId }, { type: "LearningProgress", id: courseId }, "LearningCourse", "LearnerAnalytics", "SectionQuiz"] : [],
      async onQueryStarted({ courseId, action }, { dispatch, queryFulfilled }) {
        try { await queryFulfilled; dispatch(paymentApi.util.invalidateTags(["LearningLibrary", ...(action === "leave" ? [{ type: "CourseAccess", id: courseId }] : [])])); }
        catch { /* Keep current access and library state on failure. */ }
      },
    }),
    getLearningCourse: builder.query({
      query: slug => ({ url: `/api/learner/courses/by-slug/${encodeURIComponent(slug)}`, timeout: 15_000 }),
      transformResponse: response => ({ ...normalizeRecordedCourseDetail(response), canManage: response.data.canManage === true }),
      providesTags: ["LearningCourse"],
    }),
    getLearnerAnalytics: builder.query({
      query: () => ({ url: "/api/learner/analytics", timeout: 15_000 }),
      transformResponse: unwrap, providesTags: ["LearnerAnalytics"],
    }),
    getCourseProgress: builder.query({
      query: courseId => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/progress`, timeout: 15_000 }),
      transformResponse: unwrap, providesTags: (_result, _error, id) => [{ type: "LearningProgress", id }],
    }),
    startLessonWatch: builder.mutation({
      query: ({ courseId, sectionId, lessonId, position }) => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}/watch`, method: "POST", body: { position }, timeout: 15_000 }),
      transformResponse: unwrap,
    }),
    recordLessonWatch: builder.mutation({
      query: ({ courseId, sectionId, lessonId, watchId, sequence, position, event }) => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}/watch/heartbeat`, method: "POST", body: { watchId, sequence, position, event }, timeout: 15_000 }),
      transformResponse: unwrap,
      invalidatesTags: (result, _error, { courseId }) => result?.lesson.completed ? [{ type: "LearningProgress", id: courseId }, "LearnerAnalytics"] : [],
    }),
    getSectionQuiz: builder.query({
      query: ({ courseId, sectionId }) => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/quiz`, timeout: 15_000 }),
      transformResponse: unwrap, providesTags: (_result, _error, { courseId, sectionId }) => [{ type: "SectionQuiz", id: `${courseId}/${sectionId}` }],
    }),
    submitSectionQuiz: builder.mutation({
      query: ({ courseId, sectionId, version, idempotencyKey, answers }) => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/quiz/attempts`, method: "POST", body: { version, idempotencyKey, answers }, timeout: 20_000 }),
      transformResponse: unwrap,
      invalidatesTags: (result, _error, { courseId, sectionId }) => result ? [{ type: "SectionQuiz", id: `${courseId}/${sectionId}` }, { type: "LearningProgress", id: courseId }] : [],
    }),
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
      invalidatesTags: (result, _error, { courseId }) => result ? [{ type: "Enrollment", id: courseId }, "LearnerAnalytics"] : [],
      async onQueryStarted({ courseId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(paymentApi.util.invalidateTags([{ type: "CourseAccess", id: courseId }, "LearningLibrary"]));
        } catch { /* Keep existing access unchanged on failure. */ }
      },
    }),
  }),
});
export const { useGetLearnerProfileQuery, useUpdateLearnerProfileMutation, useGetEnrollmentQuery, useEnrollFreeCourseMutation, useGetCourseProgressQuery, useStartLessonWatchMutation, useRecordLessonWatchMutation, useGetSectionQuizQuery, useSubmitSectionQuizMutation } = learnerApi;
export default learnerApi;
