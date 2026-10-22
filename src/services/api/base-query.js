import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Shared by API slices only; direct storage uploads must use their own request.
export const apiBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
  credentials: "include",
  prepareHeaders(headers, { arg }) {
    const method = (
      typeof arg === "string" ? "GET" : arg.method || "GET"
    ).toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method))
      headers.set("X-CSRF-Protection", "1");
    return headers;
  },
});
