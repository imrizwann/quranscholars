export function loginDestination(user, returnTo) {
  // Only known local destinations; the destination's guard still verifies access.
  if (typeof returnTo === "string" && !returnTo.includes("\\") && ![...returnTo].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
    const path = returnTo.split(/[?#]/)[0];
    const shared = /^(?:\/(?:admission|profile|my-learning|instructor\/application)|\/dashboard(?:\/(?:learning|assignments|wishlist|purchases|profile|settings))?|\/learn\/[a-z\d_-]+(?:\/(?:lesson\/)?[a-f\d]{24})?|\/courses(?:\/[a-z\d_-]+)?)\/?$/i;
    if (shared.test(path)) return returnTo;
    if (user?.role === "admin" && /^\/admin\/(?:admissions|instructor-applications(?:\/[a-f\d]{24})?)\/?$/i.test(path)) return returnTo;
    if (user?.role === "instructor" && /^\/instructor(?:\/dashboard|\/courses(?:\/(?:new|[a-f\d]{24}|deletions\/[a-f\d]{24}))?)?\/?$/i.test(path)) return returnTo;
  }
  if (user?.role === "admin") return "/admin/admissions";
  if (user?.role !== "instructor") return "/admission";
  return "/instructor/courses";
}
