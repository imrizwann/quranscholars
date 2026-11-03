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
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(instructorApplicationApi.util.updateQueryData("getMyInstructorApplication", undefined, draft => {
            draft.application = data.application;
            draft.submissionInProgress = false;
          }));
        } catch { /* Keep the form and reconcile an uncertain response through refetch. */ }
      },
      // Reconcile uncertain responses against the saved application as well.
      invalidatesTags: ["MyApplication"],
    }),
  }),
});

export const { useGetMyInstructorApplicationQuery, useSubmitInstructorApplicationMutation } = instructorApplicationApi;
export default instructorApplicationApi;
