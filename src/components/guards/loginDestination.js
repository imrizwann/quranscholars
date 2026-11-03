export function loginDestination(user, returnTo) {
  // Only known local destinations; the destination's guard still verifies access.
  if (typeof returnTo === "string" && !returnTo.includes("\\") && ![...returnTo].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
    const path = returnTo.split(/[?#]/)[0];
    if (/^\/admission\/?$/i.test(path)) return "/courses";
    if (user?.role === "admin" && /^\/admin\/admissions\/?$/i.test(path)) return "/admin/instructor-applications";
    const shared = /^(?:\/(?:profile|my-learning|instructor\/application|get-started(?:\/(?:student|instructor))?)|\/dashboard(?:\/(?:learning|assignments|wishlist|purchases|profile|settings))?|\/learn\/[a-z\d_-]+(?:\/(?:lesson\/)?[a-f\d]{24})?|\/courses(?:\/[a-z\d_-]+)?)\/?$/i;
    if (shared.test(path)) return returnTo;
    if (user?.role === "admin" && /^\/admin\/instructor-applications(?:\/[a-f\d]{24})?\/?$/i.test(path)) return returnTo;
    if (user?.role === "instructor" && /^\/instructor(?:\/dashboard|\/courses(?:\/(?:new|[a-f\d]{24}|deletions\/[a-f\d]{24}))?)?\/?$/i.test(path)) return returnTo;
  }
  if (user?.role === "admin") return "/admin/instructor-applications";
  if (user?.role !== "instructor") return "/dashboard/learning";
  return "/instructor/courses";
}
