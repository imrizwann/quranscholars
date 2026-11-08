import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createRealtimeClient, realtimeUrl } from "./client.js";
import { setRealtimeConnected } from "./realtimeSlice.js";
import instructorApi from "@/services/api/instructor/recordedCoursesApi.js";
import notificationsApi from "@/services/api/user/notificationsApi.js";
import { useGetNotificationsQuery } from "@/services/api/user/notificationsApi.js";
import authApi from "@/services/api/user/userAuthApis.js";
import applicationApi from "@/services/api/user/instructorApplicationApi.js";
import paymentApi from "@/services/api/user/paymentApi.js";

export default function WebSocketClient() {
  const user = useSelector(state => state.user.user);
  const dispatch = useDispatch();
  const configuration = useGetNotificationsQuery(undefined, { skip: !user?._id });
  const enabled = configuration.currentData?.realtimeEnabled === true;
  const reconciled = useRef({});
  // Polling and reconnects use the same authoritative inbox as live delivery.
  // Recheck identity after an application decision; never grant roles from events.
  useEffect(() => {
    if (!user?._id) { reconciled.current = {}; return; }
    const items = configuration.currentData?.items || [];
    for (const category of ["instructor.", "enrollment."]) {
      const item = items.find(item => item.kind.startsWith(category));
      const key = item && `${user._id}:${item._id}`;
      if (!key || reconciled.current[category] === key) continue;
      reconciled.current[category] = key;
      if (category === "instructor.") {
        dispatch(applicationApi.util.invalidateTags(["MyApplication"]));
        void dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true, subscribe: false }));
      } else dispatch(paymentApi.util.invalidateTags(["LearningLibrary", "CourseAccess", "PurchaseHistory"]));
    }
  }, [configuration.currentData, user?._id, dispatch]);
  useEffect(() => {
    if (!user?._id || !enabled) return;
    let url;
    try { url = realtimeUrl(import.meta.env.VITE_REALTIME_URL || import.meta.env.VITE_API_URL || "http://localhost:3000", window.location.origin); }
    catch { return; }
    let stopped = false, timer, inboxTimer;
    const pending = new Map();
    const client = createRealtimeClient({ url,
      onStatus: connected => dispatch(setRealtimeConnected(connected)),
      verifySession: () => dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true, subscribe: false })).unwrap(),
      onEvent: event => {
        if (stopped) return;
        if (event.type === "notifications.changed") {
          if (!inboxTimer) inboxTimer = setTimeout(() => {
            inboxTimer = undefined;
            dispatch(notificationsApi.util.invalidateTags(["Notifications"]));
          }, 250);
          return;
        }
        if (event.type === "ready") {
          dispatch(notificationsApi.util.invalidateTags(["Notifications"]));
          if (user.role === "instructor") dispatch(instructorApi.util.invalidateTags(["InstructorCourse", "InstructorLessons", "InstructorSections"]));
          return;
        }
        if (user.role !== "instructor") return;
        pending.set(event.courseId + '/' + (event.lessonId || ''), event);
        if (timer) return;
        timer = setTimeout(() => {
          timer = undefined;
          const tags = [];
          for (const event of pending.values()) {
            tags.push({ type: "InstructorCourse", id: event.courseId }, { type: "InstructorCourse", id: "LIST" });
            if (event.lessonId) tags.push({ type: "InstructorLessons", id: `${event.courseId}/${event.sectionId}` }, { type: "InstructorSections", id: event.courseId });
            if (event.notificationsChanged) dispatch(notificationsApi.util.invalidateTags(["Notifications"]));
          }
          pending.clear();
          dispatch(instructorApi.util.invalidateTags(tags));
        }, 250);
      },
    });
    const wake = () => { if (document.visibilityState === "visible" && navigator.onLine) client.wake(); };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => { stopped = true; clearTimeout(timer); clearTimeout(inboxTimer); pending.clear(); window.removeEventListener("online", wake); document.removeEventListener("visibilitychange", wake); client.stop(); };
  }, [user?._id, user?.role, enabled, dispatch]);
  return null;
}
