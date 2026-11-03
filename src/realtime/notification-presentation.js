const id = value => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
export function notificationPresentation(item) {
  if (["instructor.approved", "instructor.rejected"].includes(item.kind)) return { to: "/instructor/application", category: "Instructor application", attention: item.kind === "instructor.rejected" };
  if (item.kind === "enrollment.active") return { to: typeof item.courseSlug === "string" && /^[a-z\d_-]{1,200}$/i.test(item.courseSlug) ? `/learn/${encodeURIComponent(item.courseSlug)}` : "/dashboard/learning", category: "Your learning", attention: false };
  if (["video.ready", "video.failed", "course.published"].includes(item.kind)) return { to: id(item.courseId) ? `/instructor/courses/${item.courseId}` : "/instructor/courses", category: item.kind.startsWith("video.") ? "Video preparation" : "Course publication", attention: item.kind === "video.failed" };
  return { to: "/dashboard/learning", category: "Account update", attention: false };
}
export function notificationDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date) : "Recent update";
}
