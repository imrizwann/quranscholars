import { Navigate, useLocation } from "react-router-dom";
import { useMeQuery } from "@/services/api/user/userAuthApis.js";
import AppLoader from "@/components/feedback/AppLoader.jsx";
import { useSelector } from "react-redux";
import { userMessage } from "@/lib/user-messages.js";
import InstructorAccessState from "@/components/feedback/InstructorAccessState.jsx";

export default function InstructorCourseAccess({ children }) {
  const {
    data: verifiedUser,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useMeQuery(undefined, { refetchOnMountOrArgChange: true });
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const verified = Boolean(user?._id && verifiedUser?._id === user._id && verifiedUser.role === user.role);
  const temporaryError = isError && ([408, 429, 500, 502, 503, 504, "FETCH_ERROR", "TIMEOUT_ERROR"].includes(error?.status));
  if (isLoading || (isFetching && !verified))
    return <AppLoader label="Checking instructor access..." />;
  if (error?.status === 401 || (!user && !isError))
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (isError && !(verified && temporaryError))
    return (
      <InstructorAccessState errorMessage={userMessage(error, "We could not verify your account. Please try again shortly.")} onRetry={refetch} checking={isFetching} />
    );
  if (user?.role !== "instructor")
    return (
      <InstructorAccessState />
    );
  return <>
    {temporaryError && <div className="cw-notice cw-row cw-between" role="status">
      <p>We could not refresh your account check. {userMessage(error)} Your current work has been kept.</p>
      <button type="button" className="cw-button cw-button-compact" disabled={isFetching} onClick={refetch}>{isFetching ? "Checking account" : "Try again"}</button>
    </div>}
    {children}
  </>;
}
