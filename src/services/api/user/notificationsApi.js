import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query.js";
const unwrap = response => {
  if (response?.success !== true || !response.data) throw new Error("Invalid notifications response");
  return response.data;
};
const notificationsApi = createApi({
  reducerPath: "notificationsApi", baseQuery: apiBaseQuery, keepUnusedDataFor: 0, tagTypes: ["Notifications"],
  endpoints: builder => ({
    getNotifications: builder.query({
      query: ({ before } = {}) => ({ url: "/api/notifications", params: { limit: 20, ...(before ? { before } : {}) }, timeout: 10_000 }),
      transformResponse: unwrap, providesTags: ["Notifications"],
    }),
    readNotification: builder.mutation({
      query: id => ({ url: `/api/notifications/${encodeURIComponent(id)}/read`, method: "POST", body: {} }),
      transformResponse: unwrap, invalidatesTags: (_data, error) => error ? [] : ["Notifications"],
    }),
    readAllNotifications: builder.mutation({
      query: through => ({ url: "/api/notifications/read-all", method: "POST", body: { through } }),
      transformResponse: unwrap, invalidatesTags: (_data, error) => error ? [] : ["Notifications"],
    }),
  }),
});
export const { useGetNotificationsQuery, useReadNotificationMutation, useReadAllNotificationsMutation } = notificationsApi;
export default notificationsApi;
