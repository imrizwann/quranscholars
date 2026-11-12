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
  tagTypes: ["CourseAccess", "LearningLibrary", "PurchaseHistory"],
  endpoints: (builder) => ({
    getPurchaseHistory: builder.query({
      query: ({ before, limit = 10 } = {}) => ({ url: "/api/purchases/history", params: { ...(before && { before }), limit }, timeout: 15_000 }),
      transformResponse: unwrap,
      providesTags: ["PurchaseHistory"],
    }),
    getLearningLibrary: builder.query({
      serializeQueryArgs: ({ queryArgs }) => ({ page: queryArgs?.page ?? 1, limit: queryArgs?.limit ?? 12, view: queryArgs?.view ?? "active" }),
      query: ({ page = 1, limit = 12, view = "active" } = {}) => ({ url: "/api/purchases/library", params: { page, limit, view } }),
      transformResponse: unwrap,
      providesTags: ["LearningLibrary"],
    }),
    // Generate crypto.randomUUID() once per checkout attempt; reuse that key for
    // network retries. Persist it per account/course if checkout must survive reload.
    // No amount, userId, payment status, or entitlement flag comes from the client.
    createCourseCheckout: builder.mutation({
      query: ({ courseId, idempotencyKey }) => ({
        url: "/api/payments/checkout", method: "POST", body: { courseId, idempotencyKey }, timeout: 30_000,
      }),
      transformResponse: unwrap,
      invalidatesTags: (result, _error, { courseId }) => ["PurchaseHistory", ...(result?.state === "paid" ? [{ type: "CourseAccess", id: courseId }, "LearningLibrary"] : [])],
    }),
    getCoursePaymentStatus: builder.query({
      query: (intentId) => ({ url: `/api/payments/${encodeURIComponent(intentId)}`, timeout: 15_000 }),
      transformResponse: unwrap,
    }),
    reconcileCoursePayment: builder.mutation({
      query: ({ intentId }) => ({
        url: `/api/payments/${encodeURIComponent(intentId)}/reconcile`, method: "POST",
        body: {}, timeout: 20_000,
      }),
      transformResponse: unwrap,
      invalidatesTags: result => ["PurchaseHistory", ...(result?.state === "paid" ? ["CourseAccess", "LearningLibrary"] : [])],
    }),
    verifyCourseCheckout: builder.mutation({
      query: ({ intentId, paymentId, signature }) => ({
        url: `/api/payments/${encodeURIComponent(intentId)}/verify`, method: "POST",
        body: { paymentId, signature }, timeout: 20_000,
      }),
      transformResponse: unwrap,
      invalidatesTags: result => ["PurchaseHistory", ...(result?.state === "paid" ? ["CourseAccess", "LearningLibrary"] : [])],
    }),
    getCourseAccess: builder.query({
      extraOptions: { retryTransientRead: true },
      query: (courseId) => ({ url: `/api/purchases/${encodeURIComponent(courseId)}/access`, timeout: 15_000 }),
      transformResponse: unwrap,
      providesTags: (_result, _error, courseId) => [{ type: "CourseAccess", id: courseId }],
    }),
  }),
});

export const { useGetLearningLibraryQuery, useGetPurchaseHistoryQuery, useCreateCourseCheckoutMutation, useVerifyCourseCheckoutMutation, useReconcileCoursePaymentMutation, useGetCoursePaymentStatusQuery, useLazyGetCoursePaymentStatusQuery, useGetCourseAccessQuery } = paymentApi;
// Compatibility for the old unused import; arguments now follow the strict contract.
export const useCoursePaymentMutation = useCreateCourseCheckoutMutation;
export default paymentApi;
