import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { profilePath } from "@/features/profile/account-paths.js";

// /profile used to be a separate page. Old links, bookmarks and emails now open
// the Profile page inside the signed-in person's own workspace.
export default function AccountRedirect() {
  const role = useSelector(state => state.user.user?.role);
  const { search, hash } = useLocation();
  return <Navigate to={`${profilePath(role)}${search}${hash}`} replace />;
}
