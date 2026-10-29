import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query.js";

const root = "/api/admin/instructor-applications";
const instructorApplicationsApi = createApi({
  reducerPath: "adminInstructorApplicationsApi", baseQuery: apiBaseQuery, tagTypes: ["Applications"],
  endpoints: builder => ({
    getAdminInstructorApplications: builder.query({
      query: params => ({ url: root, params }), providesTags: ["Applications"],
    }),
    getAdminInstructorApplication: builder.query({
      query: id => `${root}/${id}`, providesTags: ["Applications"],
    }),
    reviewInstructorApplication: builder.mutation({
      query: ({ id, ...body }) => ({ url: `${root}/${id}/decision`, method: "PATCH", body }),
      invalidatesTags: ["Applications"],
    }),
    accessInstructorCertificate: builder.mutation({
      query: ({ id, index }) => ({ url: `${root}/${id}/documents/${index}/access`, method: "POST" }),
    }),
  }),
});
export const { useGetAdminInstructorApplicationsQuery, useGetAdminInstructorApplicationQuery, useReviewInstructorApplicationMutation, useAccessInstructorCertificateMutation } = instructorApplicationsApi;
export default instructorApplicationsApi;
