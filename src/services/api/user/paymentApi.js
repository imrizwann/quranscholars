import { apiBaseQuery } from "../base-query.js";
import { createApi } from "@reduxjs/toolkit/query/react";

const unwrap = (response) => {
  if (response?.success !== true || !response.data) throw new Error("Invalid payment response");
  return response.data;
};

const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: apiBaseQuery,
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    getLearningLibrary: builder.query({
      query: ({ page = 1, limit = 12 } = {}) => ({ url: "/api/purchases/library", params: { page, limit } }),
      transformResponse: unwrap,
    }),
    // Generate crypto.randomUUID() once per checkout attempt; reuse that key for
    // network retries. Persist it per account/course if checkout must survive reload.
    // No amount, userId, payment status, or entitlement flag comes from the client.
    createCourseCheckout: builder.mutation({
      query: ({ courseId, idempotencyKey }) => ({
        url: "/api/payments/checkout", method: "POST", body: { courseId, idempotencyKey }, timeout: 30_000,
      }),
      transformResponse: unwrap,
    }),
    getCoursePaymentStatus: builder.query({
      query: (intentId) => `/api/payments/${encodeURIComponent(intentId)}`,
      transformResponse: unwrap,
    }),
    getCourseAccess: builder.query({
      query: (courseId) => `/api/purchases/${encodeURIComponent(courseId)}/access`,
      transformResponse: unwrap,
    }),
  }),
});

export const { useGetLearningLibraryQuery, useCreateCourseCheckoutMutation, useGetCoursePaymentStatusQuery, useLazyGetCoursePaymentStatusQuery, useGetCourseAccessQuery } = paymentApi;
// Compatibility for the old unused import; arguments now follow the strict contract.
export const useCoursePaymentMutation = useCreateCourseCheckoutMutation;
export default paymentApi;
