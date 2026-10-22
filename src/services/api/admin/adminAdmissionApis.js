import { apiBaseQuery } from "../base-query.js";
import { createApi } from "@reduxjs/toolkit/query/react";

const adminAdmissionApis = createApi({
  reducerPath: "adminAdmissionApis",
  baseQuery: apiBaseQuery,
  tagTypes: ["AdminAdmission"],
  endpoints: (builder) => ({
    getAdminAdmissions: builder.query({
      query: ({ page = 1, limit = 20, status = "", search = "" } = {}) => ({
        url: "api/admin/admissions",
        params: { page, limit, status, search },
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((item) => ({
                type: "AdminAdmission",
                id: item._id,
              })),
              { type: "AdminAdmission", id: "LIST" },
            ]
          : [{ type: "AdminAdmission", id: "LIST" }],
    }),
    getAdminAdmissionById: builder.query({
      query: (id) => `api/admin/admissions/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminAdmission", id }],
    }),
    updateAdminAdmissionStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `api/admin/admissions/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminAdmission", id },
        { type: "AdminAdmission", id: "LIST" },
      ],
    }),
    updateAdminAdmission: builder.mutation({
      query: ({ id, payload }) => ({
        url: `api/admin/admissions/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminAdmission", id },
        { type: "AdminAdmission", id: "LIST" },
      ],
    }),
    deleteAdminAdmission: builder.mutation({
      query: (id) => ({
        url: `api/admin/admissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminAdmission", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminAdmissionsQuery,
  useGetAdminAdmissionByIdQuery,
  useUpdateAdminAdmissionStatusMutation,
  useUpdateAdminAdmissionMutation,
  useDeleteAdminAdmissionMutation,
} = adminAdmissionApis;

export default adminAdmissionApis;

