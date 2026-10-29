import AppLoader from "@/components/feedback/AppLoader.jsx";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMeQuery } from "@/services/api/user/userAuthApis.js";
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.user);
  const location = useLocation();
  const { isLoading } = useMeQuery();

  if (isLoading) {
    return <AppLoader label="Loading your account..." />;

  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }

  return children;
};

export default ProtectedRoute;
