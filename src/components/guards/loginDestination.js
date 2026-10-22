export function loginDestination(user, returnTo) {
  if (user?.role !== "instructor") return "/admission";
  // Only return to known local instructor pages, never to a supplied external URL.
  if (typeof returnTo === "string" && /^\/instructor\/courses(?:\/(?:new|[a-f\d]{24}|deletions\/[a-f\d]{24}))?$/i.test(returnTo)) return returnTo;
  return "/instructor/courses";
}
