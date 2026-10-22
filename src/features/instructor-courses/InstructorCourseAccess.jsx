import { Link, Navigate, useLocation } from "react-router-dom";
import { useMeQuery } from "@/services/api/user/userAuthApis.js";
import AppLoader from "@/components/feedback/AppLoader.jsx";

export default function InstructorCourseAccess({ children }) {
  const {
    data: user,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useMeQuery(undefined, { refetchOnMountOrArgChange: true });
  const location = useLocation();
  if (isLoading || isFetching)
    return <AppLoader label="Checking instructor access..." />;
  if (error?.status === 401)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (isError)
    return (
      <div className="p-8" role="alert">
        Could not verify your account.{" "}
        <button onClick={refetch}>Try again</button>
      </div>
    );
  if (user?.role !== "instructor")
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Instructor access required</h1>
        <p className="my-3">
          Sign in with an instructor account to manage course videos.
        </p>
        <Link to="/">Back to website</Link>
      </div>
    );
  return children;
}
