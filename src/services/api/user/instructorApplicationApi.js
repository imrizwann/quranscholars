import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query.js";

const instructorApplicationApi = createApi({
  reducerPath: "instructorApplicationApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["MyApplication"],
  endpoints: builder => ({
    getMyInstructorApplication: builder.query({
      query: () => "/api/instructor-applications/me",
      providesTags: ["MyApplication"],
    }),
    submitInstructorApplication: builder.mutation({
      query: body => ({ url: "/api/instructor-applications/me", method: "POST", body }),
      // Reconcile uncertain responses against the saved application as well.
      invalidatesTags: ["MyApplication"],
    }),
  }),
});

export const { useGetMyInstructorApplicationQuery, useSubmitInstructorApplicationMutation } = instructorApplicationApi;
export default instructorApplicationApi;
