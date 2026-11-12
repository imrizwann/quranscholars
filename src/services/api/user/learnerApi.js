import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query.js";
import paymentApi from "./paymentApi.js";
import courseApi from "../courses/courses.api.js";
import { normalizeRecordedCourseDetail } from "@/features/recorded-courses/services/recordedCourseContract.js";
import { lessonCompletionSummary } from "@/features/recorded-courses/model/courseProgress.js";

const unwrap = (response) => {
  if (response?.success !== true || !response.data) throw new Error("Invalid learner response");
  return response.data;
};
// accountId scopes the browser cache only; the API always uses authentication.
const noteTarget = ({ courseId, sectionId, lessonId, accountId }) => ({ courseId, sectionId, lessonId, accountId });
const notePath = ({ courseId, sectionId, lessonId }) => `/api/learner/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}/notes`;
async function noteSaved(args, { dispatch, queryFulfilled }) {
  try {
    const { data } = await queryFulfilled;
    dispatch(learnerApi.util.updateQueryData("getLessonNote", noteTarget(args), current => {
      if (data.revision >= current.revision) Object.assign(current, data);
    }));
  } catch { /* An unconfirmed write must not change the account copy. */ }
}
async function watchSaved({ courseId, lessonId }, { dispatch, getState, queryFulfilled }) {
  try {
    const { data } = await queryFulfilled;
    const previous = learnerApi.endpoints.getCourseProgress.select(courseId)(getState()).data?.lessons.find(lesson => lesson.lessonId === lessonId);
    // Use the confirmed write immediately. Refetching progress here adds a
    // second round trip and can race another in-flight progress read.
    dispatch(learnerApi.util.updateQueryData("getCourseProgress", courseId, current => {
      const lesson = current.lessons.find(item => item.lessonId === lessonId);
      if (!lesson) return;
      Object.assign(lesson, data.lesson);
      Object.assign(current, lessonCompletionSummary(current.lessons));
      for (const section of current.sections) {
        Object.assign(section, lessonCompletionSummary(current.lessons.filter(item => item.sectionId === section.sectionId)));
        if (section.quiz) section.quiz.unlocked = section.completed;
      }
    }));
    if (data.lesson.completed && !previous?.completed) {
      dispatch(learnerApi.util.invalidateTags(["LearnerAnalytics"]));
      dispatch(paymentApi.util.invalidateTags(["LearningLibrary"]));
    }
  } catch { /* An unconfirmed save cannot change completion or analytics. */ }
}
const learnerApi = createApi({
  reducerPath: "learnerApi", baseQuery: apiBaseQuery, keepUnusedDataFor: 0,
  tagTypes: ["LearnerProfile", "Enrollment", "LearningProgress", "SectionQuiz", "LearnerAnalytics", "LearningCourse", "LessonNote", "CourseReviews", "MyCourseReview"],
  endpoints: builder => ({
    getCourseReviews: builder.query({
      query: ({ slug, page = 1 }) => ({ url: `/api/public/recorded-courses/${encodeURIComponent(slug)}/reviews`, params: { page }, timeout: 15_000 }),
      transformResponse: unwrap, providesTags: ["CourseReviews"],
    }),
    getMyCourseReview: builder.query({
      query: courseId => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/review`, timeout: 15_000 }),
      transformResponse: unwrap, providesTags: (_result, _error, id) => [{ type: "MyCourseReview", id }],
    }),
    saveCourseReview: builder.mutation({
      query: ({ courseId, rating, comment, revision }) => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/review`, method: "PUT", body: { rating, comment, revision }, timeout: 20_000 }),
      transformResponse: unwrap, onQueryStarted: reviewSaved,
      invalidatesTags: result => result ? ["CourseReviews"] : [],
    }),
    deleteCourseReview: builder.mutation({
      query: ({ courseId, revision, confirm }) => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/review`, method: "DELETE", body: { revision, confirm }, timeout: 20_000 }),
      transformResponse: unwrap, onQueryStarted: reviewSaved,
      invalidatesTags: result => result ? ["CourseReviews"] : [],
    }),
    moderateCourseReview: builder.mutation({
      query: ({ reviewId, revision, hidden, reason }) => ({ url: `/api/admin/course-reviews/${encodeURIComponent(reviewId)}`, method: "PATCH", body: { revision, hidden, reason }, timeout: 20_000 }),
      transformResponse: unwrap, invalidatesTags: result => result ? ["CourseReviews", "MyCourseReview"] : [],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) { try { await queryFulfilled; dispatch(courseApi.util.invalidateTags(["Courses"])); } catch { /* Keep confirmed ratings. */ } },
    }),
    getLessonNote: builder.query({
      serializeQueryArgs: ({ queryArgs }) => noteTarget(queryArgs),
      query: target => ({ url: notePath(target), timeout: 15_000 }), transformResponse: unwrap,
      providesTags: (_result, _error, target) => [{ type: "LessonNote", id: notePath(target) }],
    }),
    saveLessonNote: builder.mutation({
      query: ({ content, revision, ...target }) => ({ url: notePath(target), method: "PUT", body: { content, revision }, keepalive: true, timeout: 15_000 }),
      transformResponse: unwrap, onQueryStarted: noteSaved,
    }),
    deleteLessonNote: builder.mutation({
      query: ({ revision, confirm, ...target }) => ({ url: notePath(target), method: "DELETE", body: { revision, confirm }, timeout: 15_000 }),
      transformResponse: unwrap, onQueryStarted: noteSaved,
    }),
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
      transformResponse: unwrap, onQueryStarted: watchSaved,
    }),
    recordLessonWatch: builder.mutation({
      query: ({ courseId, sectionId, lessonId, watchId, sequence, position, event }) => ({ url: `/api/learner/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}/watch/heartbeat`, method: "POST", body: { watchId, sequence, position, event }, keepalive: true, timeout: 15_000 }),
      transformResponse: unwrap, onQueryStarted: watchSaved,
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
async function reviewSaved({ courseId }, { dispatch, queryFulfilled }) {
  try {
    const { data } = await queryFulfilled;
    dispatch(learnerApi.util.updateQueryData("getMyCourseReview", courseId, current => { if (data.revision >= current.revision) Object.assign(current, data); }));
    dispatch(courseApi.util.invalidateTags(["Courses"]));
  } catch { /* Keep the last confirmed review on failure. */ }
}
export const { useGetLearnerProfileQuery, useUpdateLearnerProfileMutation, useGetEnrollmentQuery, useEnrollFreeCourseMutation, useGetCourseProgressQuery, useStartLessonWatchMutation, useRecordLessonWatchMutation, useGetSectionQuizQuery, useSubmitSectionQuizMutation } = learnerApi;
export default learnerApi;
