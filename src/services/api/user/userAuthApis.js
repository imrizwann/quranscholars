import { apiBaseQuery, renewSession } from "../base-query.js";
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
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch({ type: "user/setUser", payload: data });
        } catch { /* Renewal handles a definitively expired session. */ }
      },
    }),
    refreshSession: builder.mutation({
      queryFn: (_arg, api, extraOptions) => renewSession(api, extraOptions),
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
  useRefreshSessionMutation,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useDeleteProfileMutation,
} = userAuthApi;

export default userAuthApi;
