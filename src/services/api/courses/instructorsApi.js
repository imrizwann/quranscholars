import courseApi from "./courses.api.js";

const unwrap = response => {
  if (response?.success !== true || !response.data) throw new Error("Invalid instructor response");
  return response.data;
};
const isInstructor = item => typeof item?.id === "string" && /^[a-f\d]{24}$/i.test(item.id) && typeof item.name === "string" && Array.isArray(item.languages) && Number.isInteger(item.courseCount) && item.courseCount >= 0;
const instructorsApi = courseApi.injectEndpoints({
  endpoints: builder => ({
    getPublicInstructors: builder.query({
      query: ({ page = 1, search = "" } = {}) => ({ url: "/api/public/instructors", params: { page, limit: 12, ...(search && { search }) } }),
      transformResponse: response => {
        const data = unwrap(response);
        if (!Array.isArray(data.items) || !data.items.every(isInstructor) || !data.pagination) throw new Error("Invalid instructor list");
        return data;
      },
      keepUnusedDataFor: 60,
    }),
    getPublicInstructor: builder.query({
      query: id => `/api/public/instructors/${encodeURIComponent(id)}`,
      transformResponse: response => {
        const data = unwrap(response);
        if (!isInstructor(data.instructor)) throw new Error("Invalid instructor profile");
        return data.instructor;
      },
      keepUnusedDataFor: 60,
    }),
  }),
});
export const { useGetPublicInstructorsQuery, useGetPublicInstructorQuery } = instructorsApi;
export default instructorsApi;
