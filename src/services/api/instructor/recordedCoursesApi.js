import { createApi, retry } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query.js";

const root = "/api/instructor/recorded-courses";

const courseUrl = ({ courseId }) => `${root}/${encodeURIComponent(courseId)}`;

const sectionsUrl = (args) => `${courseUrl(args)}/sections`;

const sectionUrl = (args) =>
  `${sectionsUrl(args)}/${encodeURIComponent(args.sectionId)}`;

const lessonsUrl = (args) => `${sectionUrl(args)}/lessons`;

const lessonUrl = (args) =>
  `${lessonsUrl(args)}/${encodeURIComponent(args.lessonId)}`;

const videoUrl = (args) =>
  args.lessonId ? `${lessonUrl(args)}/video` : `${courseUrl(args)}/trailer`;

const courseTag = ({ courseId }) => ({
  type: "InstructorCourse",
  id: courseId,
});

const sectionTag = ({ courseId }) => ({
  type: "InstructorSections",
  id: courseId,
});

const lessonTag = ({ courseId, sectionId }) => ({
  type: "InstructorLessons",
  id: `${courseId}/${sectionId}`,
});

const listTag = { type: "InstructorCourse", id: "LIST" };

const videoTags = (args) =>
  args.lessonId ? [lessonTag(args), courseTag(args)] : [courseTag(args)];

const onSuccess = (tags) => (_result, error, args) => (error ? [] : tags(args));

const hasId = (value) => typeof value === "string" && value.length > 0;

const isPage =
  (key, titleKey = "title") =>
  (data) =>
    Array.isArray(data?.[key]) &&
    data[key].every(
      (item) => hasId(item?._id) && typeof item?.[titleKey] === "string",
    ) &&
    Number.isInteger(data.pagination?.page) &&
    typeof data.pagination?.hasNextPage === "boolean";

const deletionResult = { validate: (data) => hasId(data?.deletionId) };

// Processing is idempotent for an uploadId, including when its response is lost.
// Never retry upload reservations, creation or deletion automatically.
const processRequest = retry(apiBaseQuery, {
  retryCondition: (error, _args, { attempt, baseQueryApi }) =>
    attempt <= 1 &&
    !baseQueryApi.signal.aborted &&
    ["FETCH_ERROR", "TIMEOUT_ERROR"].includes(error.status),
});

const instructorCoursesApi = createApi({
  reducerPath: "instructorCoursesApi",
  // Unwrap the API envelope once; preserve structured RTK Query errors for the UI.
  baseQuery: async (args, api, extraOptions) => {
    const request = extraOptions?.retryProcessing
      ? processRequest
      : apiBaseQuery;
    const result = await request(
      { ...args, timeout: 30_000 },
      api,
      extraOptions,
    );
    if (result.error) return result;
    // Older trailer upload responses placed the reservation outside `data`.
    const data =
      result.data?.data ??
      (extraOptions?.allowFlatResponse ? result.data : undefined);
    if (
      result.data?.success === false ||
      data == null ||
      (extraOptions?.validate && !extraOptions.validate(data))
    ) {
      return {
        error: {
          status: "CUSTOM_ERROR",
          error:
            "The server returned an unexpected response. Refresh to check the latest status.",
        },
      };
    }
    return { data, meta: result.meta };
  },
  tagTypes: ["InstructorCourse", "InstructorSections", "InstructorLessons"],
  // Private workspace data is retained only while a screen subscribes to it.
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: ({ page = 1, limit = 50 } = {}) => ({
        url: `${root}/categories`,
        params: { page, limit },
      }),
      extraOptions: { validate: isPage("items", "name") },
    }),
    getCourses: builder.query({
      query: ({ page = 1, limit = 12, search = "" } = {}) => ({
        url: root,
        params: { page, limit, sort: "updated", ...(search && { search }) },
      }),
      extraOptions: { validate: isPage("courses") },
      providesTags: (result) => [
        listTag,
        ...(result?.courses || []).map((course) =>
          courseTag({ courseId: course._id }),
        ),
      ],
    }),
    getCourse: builder.query({
      query: (args) => ({ url: courseUrl(args) }),
      extraOptions: {
        validate: (data) =>
          hasId(data?.course?._id) && typeof data.course.title === "string",
      },
      providesTags: (_result, _error, args) => [courseTag(args)],
    }),
    getSections: builder.query({
      query: (args) => ({
        url: sectionsUrl(args),
        params: { page: args.page || 1, limit: 20 },
      }),
      extraOptions: { validate: isPage("items") },
      providesTags: (_result, _error, args) => [sectionTag(args)],
    }),
    getLessons: builder.query({
      query: (args) => ({
        url: lessonsUrl(args),
        params: { page: args.page || 1, limit: 10 },
      }),
      extraOptions: { validate: isPage("items") },
      providesTags: (_result, _error, args) => [lessonTag(args)],
    }),
    getDeletion: builder.query({
      query: ({ deletionId }) => ({
        url: `${root}/deletions/${encodeURIComponent(deletionId)}`,
      }),
      extraOptions: {
        validate: (data) =>
          hasId(data?.deletionId) &&
          typeof data.storageCleanupPending === "boolean",
      },
    }),
    createCourse: builder.mutation({
      query: (body) => ({ url: root, method: "POST", body }),
      extraOptions: { validate: (data) => hasId(data?.courseId) },
      invalidatesTags: onSuccess(() => [listTag]),
    }),
    createSection: builder.mutation({
      query: (args) => ({
        url: sectionsUrl(args),
        method: "POST",
        body: { title: args.title },
      }),
      invalidatesTags: onSuccess((args) => [sectionTag(args), courseTag(args)]),
    }),
    createLesson: builder.mutation({
      query: (args) => ({
        url: lessonsUrl(args),
        method: "POST",
        body: { title: args.title },
      }),
      invalidatesTags: onSuccess((args) => [lessonTag(args), courseTag(args)]),
    }),
    deleteCourse: builder.mutation({
      query: (args) => ({ url: courseUrl(args), method: "DELETE" }),
      extraOptions: deletionResult,
      // The detail screen leaves after success; do not refetch a deleted resource.
      invalidatesTags: onSuccess(() => [listTag]),
    }),
    deleteSection: builder.mutation({
      query: (args) => ({ url: sectionUrl(args), method: "DELETE" }),
      extraOptions: deletionResult,
      invalidatesTags: onSuccess((args) => [sectionTag(args), courseTag(args)]),
    }),
    deleteLesson: builder.mutation({
      query: (args) => ({ url: lessonUrl(args), method: "DELETE" }),
      extraOptions: deletionResult,
      invalidatesTags: onSuccess((args) => [lessonTag(args), courseTag(args)]),
    }),
    deleteVideo: builder.mutation({
      query: (args) => ({ url: videoUrl(args), method: "DELETE" }),
      extraOptions: deletionResult,
      invalidatesTags: onSuccess(videoTags),
    }),
    prepareVideoUpload: builder.mutation({
      query: (args) => ({
        url: `${videoUrl(args)}/upload`,
        method: "POST",
        body: args.metadata,
      }),
      extraOptions: {
        allowFlatResponse: true,
        validate: (data) =>
          hasId(data?.uploadId) && typeof data.uploadUrl === "string",
      },
      invalidatesTags: onSuccess(videoTags),
    }),
    processVideo: builder.mutation({
      query: (args) => ({
        url: `${videoUrl(args)}/process`,
        method: "POST",
        body: { uploadId: args.uploadId },
      }),
      extraOptions: { retryProcessing: true },
      invalidatesTags: onSuccess(videoTags),
    }),
  }),
});

export const {
  useCreateCourseMutation,
  useCreateSectionMutation,
  useCreateLessonMutation,
  useDeleteCourseMutation,
  useDeleteSectionMutation,
  useDeleteLessonMutation,
  useDeleteVideoMutation,
  usePrepareVideoUploadMutation,
  useProcessVideoMutation,
} = instructorCoursesApi;
export default instructorCoursesApi;
