export function instructorProfileUrl(instructor) {
  const value = instructor?.profileUrl;
  return typeof value === "string" && /^\/instructors\/[a-f\d]{24}$/i.test(value) ? value : null;
}
