import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import Navbar from "@/layouts/Navbar.jsx";
import Footer from "@/layouts/Footer.jsx";
import { useLocation } from "react-router-dom";
import useSessionRenewal from "@/features/auth/useSessionRenewal.js";
import { useMeQuery } from "@/services/api/user/userAuthApis.js";
import AppLoader from "@/components/feedback/AppLoader.jsx";
import DevelopmentWelcome from "@/components/feedback/DevelopmentWelcome.jsx";
import RouteScrollManager from "@/components/navigation/RouteScrollManager.jsx";
function App() {
  useMeQuery();
  useSessionRenewal();
  const pathName = useLocation();
  const isWorkspace =
    pathName.pathname.startsWith("/learn/") ||
    pathName.pathname.startsWith("/classroom/") ||
    pathName.pathname.startsWith("/dashboard") ||
    pathName.pathname.startsWith("/admin/") ||
    pathName.pathname === "/instructor" ||
    (pathName.pathname.startsWith("/instructor/") && !/^\/instructor\/application\/?$/.test(pathName.pathname));
  return (
    <>
      <RouteScrollManager />
      <div>
        {!isWorkspace && <Navbar />}
        <div className={!isWorkspace ? "public-route-content" : undefined}>
          <Suspense fallback={<AppLoader />}><Outlet /></Suspense>
        </div>
        {!isWorkspace && <Footer />}
      </div>
      <DevelopmentWelcome />
    </>
  );
}

export default App;
