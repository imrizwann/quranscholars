import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "./base-query.js";

const root = admin => `/api/${admin ? "admin" : "instructor"}/revenue`;
const revenueApi = createApi({
  reducerPath: "revenueApi", baseQuery: apiBaseQuery, keepUnusedDataFor: 0, tagTypes: ["Revenue"],
  endpoints: builder => ({
    getRevenue: builder.query({
      query: ({ admin, view, id, ...params }) => ({ url: `${root(admin)}/${view}${id ? `/${id}` : ""}`, params }),
      transformResponse: response => response.data, providesTags: ["Revenue"],
    }),
    revenueAction: builder.mutation({
      query: ({ operation, id, body }) => ({ url: `${root(true)}/${operation === "review" ? `sales/${id}/review` : operation === "refresh" ? `sales/${id}/refresh` : operation === "payout" ? "payouts" : operation === "payoutAction" ? `payouts/${id}/actions` : "sync"}`, method: operation === "review" ? "PATCH" : "POST", body }),
      transformResponse: response => response.data, invalidatesTags: ["Revenue"],
    }),
  }),
});
export const revenueSessionMiddleware = ({ getState, dispatch }) => next => action => {
  const previous = getState().user?.user;
  const result = next(action);
  if (action.type === "user/setUser") {
    const current = getState().user?.user;
    if (previous?._id !== current?._id || previous?.role !== current?.role) {
      dispatch(revenueApi.util.getRunningQueriesThunk()).forEach(request => request.abort());
      dispatch(revenueApi.util.getRunningMutationsThunk()).forEach(request => request.abort());
      dispatch(revenueApi.util.resetApiState());
    }
  }
  return result;
};
export default revenueApi;
