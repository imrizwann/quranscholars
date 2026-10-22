import { apiBaseQuery } from "../base-query.js";
import { createApi } from "@reduxjs/toolkit/query/react";

const admissionApis = createApi({
  reducerPath: "admissionApis",
  baseQuery: apiBaseQuery,
  tagTypes: ["Admission"],
  endpoints: (builder) => ({
    getMyAdmission: builder.query({
      query: () => "api/admission/me",
      transformResponse: (response) => response || null,
      providesTags: (result) =>
        result
          ? [
            { type: "Admission", id: result._id },
            { type: "Admission", id: "LIST" },
          ]
          : [{ type: "Admission", id: "LIST" }],
    }),
    join: builder.mutation({
      query: (data) => ({
        url: "api/admission/me",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Admission", id: "LIST" }],
    }),
    update: builder.mutation({
      query: (data) => ({
        url: "api/admission/me",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result) =>
        result?.admission?._id
          ? [
            { type: "Admission", id: result.admission._id },
            { type: "Admission", id: "LIST" },
          ]
          : [{ type: "Admission", id: "LIST" }],
    }),
  }),
});

export const { useGetMyAdmissionQuery, useJoinMutation, useUpdateMutation } =
  admissionApis;

export default admissionApis;
