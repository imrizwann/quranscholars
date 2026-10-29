import AppLoader from "@/components/feedback/AppLoader.jsx";
import { Navigate, useLocation } from "react-router-dom";
import { userMessage } from "@/lib/user-messages.js";
import { useMeQuery } from "@/services/api/user/userAuthApis.js";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { data: user, isLoading, isFetching, error, refetch } = useMeQuery(undefined, { refetchOnMountOrArgChange: true });
  const isAdmin = String(user?.role || "").trim().toLowerCase() === "admin";

  if (isLoading) {
    return <AppLoader label="Loading your account..." />;

  }

  if (error && error.status !== 401) {
    return <main className="public-page"><section className="public-panel" role="alert"><h1>Could not verify admin access</h1><p>{userMessage(error)}</p><div className="public-actions"><button className="cw-button" disabled={isFetching} onClick={refetch}>Try again</button></div></section></main>;
  }
  if (!user || error?.status === 401) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
