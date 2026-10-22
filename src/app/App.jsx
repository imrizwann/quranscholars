import { Outlet } from "react-router-dom";
import { Suspense, useEffect } from "react";
import Navbar from "@/layouts/Navbar.jsx";
import Footer from "@/layouts/Footer.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/store/slices/userSlice.js";
import { useMeQuery } from "@/services/api/user/userAuthApis.js";
import AppLoader from "@/components/feedback/AppLoader.jsx";
import DevelopmentWelcome from "@/components/feedback/DevelopmentWelcome.jsx";
import RouteScrollManager from "@/components/navigation/RouteScrollManager.jsx";
function App() {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pathName = useLocation();
  const isWorkspace = 
    pathName.pathname.startsWith("/learn/") ||
    pathName.pathname.startsWith("/classroom/") ||
    pathName.pathname.startsWith("/dashboard") ||
    /^\/admin\/admissions\/?$/.test(pathName.pathname) ||
    pathName.pathname === "/instructor" ||
    pathName.pathname.startsWith("/instructor/");
  const {
    data: currentUser,
    isSuccess: isUserSyncSuccess,
    isError: isUserSyncError,
    error: userSyncError,
  } = useMeQuery();

  useEffect(() => {
    if (isUserSyncSuccess && currentUser) {
      dispatch(setUser(currentUser));
      return;
    }
    if (isUserSyncError) {
      if (userSyncError?.status === 401 || userSyncError?.status === 403) {
        dispatch(setUser(null));
      }
    }
  }, [
    currentUser,
    dispatch,
    isUserSyncError,
    isUserSyncSuccess,
    userSyncError?.status,
  ]);

  useEffect(() => {
    if (!user?.expires || typeof user.expires !== "number") return;
    const handleSessionExpire = () => {
      localStorage.removeItem("user");
      dispatch(setUser(null));
      navigate("/", { replace: true });
    };
    const remainingTime = user.expires - Date.now();
    if (remainingTime <= 0) {
      handleSessionExpire();
      return;
    }
    const timeoutId = setTimeout(handleSessionExpire, remainingTime);
    return () => clearTimeout(timeoutId);
  }, [user, navigate, dispatch]);

  return (
    <>
      <RouteScrollManager />
      <div>
        {!isWorkspace && <Navbar />}
        <Suspense fallback={<AppLoader />}><Outlet /></Suspense>
        {!isWorkspace && <Footer />}
      </div>
      <DevelopmentWelcome />
    </>
  );
}

export default App;
