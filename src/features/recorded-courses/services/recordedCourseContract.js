import { adaptRecordedCourse } from "../model/recordedCourseAdapter.js";

export const recordedCourseLevels = ["All", "Beginner", "Intermediate", "Advanced"];
export const recordedCourseLanguages = ["All", "English", "Arabic", "Hindi", "Urdu"];
const positiveInteger = (value, fallback) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

export const buildRecordedCourseQuery = (args = {}) => {
  const params = {
    page: positiveInteger(args.page, 1),
    limit: Math.min(50, positiveInteger(args.limit, 12)),
  };
  const search = String(args.search || "").trim().slice(0, 100);
  if (search) params.search = search;
  if (args.category && args.category !== "All") params.category = String(args.category).trim().toLowerCase().slice(0, 100);
  if (recordedCourseLevels.includes(args.level) && args.level !== "All") params.level = args.level;
  if (args.language && args.language !== "All") params.language = String(args.language).trim().slice(0, 50);
  // The strict public schema has no sort parameter; the server returns newest first.
  return params;
};

export const normalizeRecordedCourseList = (response) => {
  const payload = response?.data;
  if (!Array.isArray(payload?.courses) || !payload?.pagination) throw new Error("Invalid course list response");
  return {
    courses: payload.courses.map(adaptRecordedCourse),
    pagination: payload.pagination,
    filters: payload.filters || {},
  };
};
