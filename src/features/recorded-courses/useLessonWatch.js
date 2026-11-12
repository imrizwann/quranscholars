import { useEffect, useMemo, useRef, useState } from "react";
import { useStartLessonWatchMutation, useRecordLessonWatchMutation } from "@/services/api/user/learnerApi.js";
import { createLearningWatch, WATCH_REPORT_INTERVAL } from "@/lib/learning-watch.js";
import { userMessage } from "@/lib/user-messages.js";

export default function useLessonWatch({ courseId, sectionId, lessonId }) {
  const [start] = useStartLessonWatchMutation();
  const [heartbeat] = useRecordLessonWatchMutation();
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState("");
  const current = useRef(null);
  const key = `${courseId}/${sectionId}/${lessonId}`;
  useEffect(() => {
    setStatus("ready");
    setError("");
    if (!lessonId || !sectionId) return;
    const target = { courseId, sectionId, lessonId };
    const controller = createLearningWatch({
      start: body => start({ ...target, ...body }).unwrap(),
      heartbeat: body => heartbeat({ ...target, ...body }).unwrap(),
      onStatus: (status, failure) => { setStatus(status); setError(failure ? userMessage(failure) : ""); },
    });
    current.current = { key, controller };
    const timer = setInterval(() => controller.tick(), WATCH_REPORT_INTERVAL);
    const flush = () => controller.flush();
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    return () => { clearInterval(timer); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); controller.dispose(); if (current.current?.controller === controller) current.current = null; };
  }, [courseId, sectionId, lessonId, key, start, heartbeat]);
  const controls = useMemo(() => {
    const invoke = (name, data) => { if (current.current?.key === key) current.current.controller[name](data?.currentTime); };
    return { update: data => invoke("update", data), play: data => invoke("play", data), pause: data => invoke("pause", data), seeking: () => invoke("seeking"), seek: data => invoke("seek", data), retry: () => invoke("retry") };
  }, [key]);
  return { ...controls, status, error };
}
