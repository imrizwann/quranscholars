import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu } from "@base-ui/react/menu";
import { ArrowUpRight, BookOpen, LayoutDashboard, LogOut, Presentation, ReceiptText, Settings, UserRound } from "lucide-react";
import useProfilePhoto from "@/features/profile/useProfilePhoto.js";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import useSignOut from "@/features/auth/useSignOut.js";
import NotificationBell from "@/realtime/NotificationBell.jsx";

export default function WorkspaceAccountMenu({ type }) {
  const user = useSelector((state) => state.user.user);
  const { data } = useProfilePhoto();
  const { signOut, isSigningOut } = useSignOut();
  const [open, setOpen] = useState(false);
  const { key: locationKey } = useLocation();
  const role = type === "admin" ? "Admin" : type === "instructor" ? "Instructor" : "Learner";
  const name = user?.name?.trim() || "Your account";
  const base = type === "instructor" ? "/instructor" : "/dashboard";
  const links = [
    { to: "/profile", label: "My profile", icon: UserRound },
    { to: "/dashboard/purchases", label: "Purchases", icon: ReceiptText },
    ...(user?.role === "instructor" ? [{ to: "/instructor/dashboard", label: "Instructor dashboard", icon: Presentation }] : []),
    ...(type === "admin" ? [] : [{ to: `${base}/settings`, label: "Account settings", icon: Settings }]),
    { to: type === "admin" ? "/admin/instructor-applications" : type === "instructor" ? `${base}/courses` : `${base}/learning`, label: type === "admin" ? "Instructor applications" : type === "instructor" ? "Manage courses" : "My learning", icon: LayoutDashboard },
    { to: "/courses", label: "Browse courses", icon: BookOpen },
    ...(type === "admin" ? [] : [
      type === "instructor"
        ? { to: "/dashboard/learning", label: "My learning", icon: BookOpen }
        : { to: "/get-started/instructor", label: "Explore teaching", icon: Presentation },
    ]),
    { to: "/", label: "Back to website", icon: ArrowUpRight },
  ];

  useEffect(() => { setOpen(false); }, [locationKey]);

  return <div className="workspace-header-actions"><NotificationBell /><Menu.Root open={open} onOpenChange={setOpen} modal={false}>
    <Menu.Trigger className="workspace-account" aria-label={`Account menu for ${name}`}>
      <ProfileAvatar src={data?.smallUrl || data?.url} name={user?.name} />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner align="end" sideOffset={10} collisionPadding={12} className="workspace-account-positioner">
        <Menu.Popup className="workspace-account-popup qs-popup-motion" aria-label="Your account">
          <div className="workspace-account-summary">
            <span className="workspace-account-role">{role} account</span>
            <strong>{name}</strong>
            {user?.email && <span className="workspace-account-email">{user.email}</span>}
          </div>
          <div className="workspace-account-links">
            {links.map(({ to, label, icon: Icon }) => <Menu.Item key={to} render={<Link to={to} />} className="workspace-account-item"><Icon size={17} aria-hidden="true" /><span>{label}</span></Menu.Item>)}
          </div>
          <Menu.Separator className="workspace-account-divider" />
          <div className="workspace-account-links">
            <Menu.Item className="workspace-account-item workspace-account-signout" disabled={isSigningOut} closeOnClick={false} onClick={signOut}>
              <LogOut size={17} aria-hidden="true" /><span>{isSigningOut ? "Signing out…" : "Log out"}</span>
            </Menu.Item>
          </div>
          <span className="sr-only" role="status">{isSigningOut ? "Signing out. Please wait." : ""}</span>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root></div>;
}
