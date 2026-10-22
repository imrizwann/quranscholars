import { apiBaseQuery } from "../base-query.js";
import { createApi } from "@reduxjs/toolkit/query/react";

const userAuthApi = createApi({
  reducerPath: "userAuthApi",
  baseQuery: apiBaseQuery,

  endpoints: (builder) => ({
    me: builder.query({
      query: () => ({
        url: "api/auth/me",
        method: "GET",
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: "api/auth/register",
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation({
      query: (data) => ({
        url: "api/auth/login",
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "api/auth/logout",
        method: "POST",
      }),
    }),
    deleteProfile: builder.mutation({
      query: (body) => ({
        url: "api/auth/delete_profile",
        method: 'POST',
        body: body
      })
    })
  }),
});

export const {
  useMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useDeleteProfileMutation,
} = userAuthApi;

export default userAuthApi;
