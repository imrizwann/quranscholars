import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { loginDestination } from "./loginDestination.js";
const NotLoggedIn = ({ children }) => {
  const { user } = useSelector((state) => state.user);
  const location = useLocation();
  if (user) {
    return <Navigate to={loginDestination(user, location.state?.from)} replace />;
  }
  return children;
};

export default NotLoggedIn;
