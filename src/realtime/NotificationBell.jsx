import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { Popover } from "@base-ui/react/popover";
import { Bell, CheckCircle2, CircleAlert } from "lucide-react";
import { useGetNotificationsQuery, useReadNotificationMutation, useReadAllNotificationsMutation } from "@/services/api/user/notificationsApi.js";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import "./notifications.css";

export default function NotificationBell() {
  const user = useSelector(state => state.user.user);
  return user ? <Notifications key={user._id} /> : null;
}
function Notifications() {
  const connected = useSelector(state => state.realtime?.connected);
  const [open, setOpen] = useState(false);
  const [before, setBefore] = useState();
  const [error, setError] = useState("");
  const { key } = useLocation();
  const latest = useGetNotificationsQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true, pollingInterval: 60_000, skipPollingIfUnfocused: true });
  const older = useGetNotificationsQuery({ before }, { skip: !open || !before });
  const query = before ? older : latest;
  const data = query.currentData;
  const unread = latest.currentData?.unreadCount || 0;
  const [read] = useReadNotificationMutation();
  const [readAll, reading] = useReadAllNotificationsMutation();
  useEffect(() => { setOpen(false); setBefore(undefined); setError(""); }, [key]);
  const mark = id => { void read(id).unwrap().catch(() => setError("We could not mark this update as read. Please try again.")); };
  const markAll = async () => {
    setError("");
    try { await readAll(data.items[0]._id).unwrap(); }
    catch { setError("We could not mark your updates as read. Please try again."); }
  };
  return <Popover.Root open={open} onOpenChange={value => { setOpen(value); if (!value) { setBefore(undefined); setError(""); } }}>
    <Popover.Trigger className="notification-trigger" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}><Bell size={19} aria-hidden="true" />{unread > 0 && <span className="notification-count" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}</Popover.Trigger>
    <Popover.Portal><Popover.Positioner align="end" sideOffset={8} collisionPadding={12} className="notification-positioner"><Popover.Popup className="notification-popup qs-popup-motion">
      <div className="notification-heading"><div><Popover.Title>Notifications</Popover.Title><p>{connected ? "Live updates are on" : "Updates refresh automatically"}</p></div>{!before && unread > 0 && data?.items.length > 0 && <button type="button" disabled={reading.isLoading} onClick={markAll}>{reading.isLoading ? "Saving…" : "Mark all read"}</button>}</div>
      {query.isLoading || (before && !data && query.isFetching) ? <div className="notification-message"><LoadingState label="Loading notifications" variant="inline" /></div> : query.error ? <div className="notification-message" role="alert"><p>Your notifications could not load.</p><button type="button" disabled={query.isFetching} onClick={query.refetch}>{query.isFetching ? "Checking…" : "Try again"}</button></div> : !data?.items.length ? <div className="notification-message"><Bell size={24} aria-hidden="true" /><strong>You’re all caught up</strong><p>Updates about your courses will appear here.</p></div> : <ul className="notification-list">{data.items.map(item => <li key={item._id}><Link to={`/instructor/courses/${encodeURIComponent(item.courseId)}`} className="notification-link" data-unread={!item.readAt} onClick={() => { if (!item.readAt) mark(item._id); setOpen(false); }}>{item.kind === "video.ready" ? <CheckCircle2 size={20} aria-hidden="true" /> : <CircleAlert size={20} aria-hidden="true" />}<span><strong>{item.title}</strong><span>{item.message}</span><time dateTime={item.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}{!item.readAt && " · Unread"}</time></span></Link></li>)}</ul>}
      {error && <p className="notification-error" role="alert">{error}</p>}
      {(before || data?.nextCursor) && <div className="notification-footer">{before && <button type="button" onClick={() => setBefore(undefined)}>Latest updates</button>}{data?.nextCursor && <button type="button" onClick={() => setBefore(data.nextCursor)}>Older updates</button>}</div>}
    </Popover.Popup></Popover.Positioner></Popover.Portal>
  </Popover.Root>;
}
