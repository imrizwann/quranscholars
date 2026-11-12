import revenueApi from "./revenueApi.js";

const operationsApi = revenueApi.injectEndpoints({
  endpoints: builder => ({
    getOperations: builder.query({
      query: () => ({ url: "/api/admin/operations", timeout: 15_000 }),
      transformResponse: response => {
        const data = response?.data;
        if (!data || !["databaseReady", "emailConfigured", "checkoutConfigured"].every(key => typeof data[key] === "boolean") || !["payments", "exceptions", "failedLessons", "failedTrailers"].every(key => Array.isArray(data[key]))) throw new Error("Invalid operations response");
        return data;
      }, providesTags: ["Revenue"],
    }),
    runOperation: builder.mutation({
      query: ({ action, id }) => ({ url: `/api/admin/operations/${action === "emails" ? "emails/retry" : `payments/${encodeURIComponent(id)}/reconcile`}`, method: "POST", body: {}, timeout: 20_000 }),
      transformResponse: response => response.data, invalidatesTags: ["Revenue"],
    }),
  }),
});
export const { useGetOperationsQuery, useRunOperationMutation } = operationsApi;
