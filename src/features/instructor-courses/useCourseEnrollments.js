import { useMemo } from "react";
import instructorApi from "@/services/api/instructor/recordedCoursesApi.js";

// The course's stored totalStudents field is not kept up to date by the API, so
// enrollment counts come from the analytics endpoint, which counts confirmed
// enrollments (refunds excluded). One request covers up to 50 courses (the API maximum).
const ENROLLMENT_ARGS = { page: 1, limit: 50 };

export default function useCourseEnrollments() {
  const query = instructorApi.endpoints.getAnalytics.useQuery(ENROLLMENT_ARGS, { refetchOnMountOrArgChange: true });
  const data = query.isError ? null : query.currentData;
  const counts = useMemo(
    () => (data ? new Map(data.courses.map((course) => [String(course._id), Number(course.enrollments) || 0])) : null),
    [data],
  );
  return { counts, summary: data?.summary };
}
