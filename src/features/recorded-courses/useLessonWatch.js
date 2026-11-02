import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import learnerApi, { useStartLessonWatchMutation, useRecordLessonWatchMutation } from "@/services/api/user/learnerApi.js";
import { createLearningWatch } from "@/lib/learning-watch.js";
import { userMessage } from "@/lib/user-messages.js";

export default function useLessonWatch({ courseId, sectionId, lessonId }) {
  const [start] = useStartLessonWatchMutation();
  const [heartbeat] = useRecordLessonWatchMutation();
  const dispatch = useDispatch();
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
      onLesson: lesson => dispatch(learnerApi.util.updateQueryData("getCourseProgress", courseId, data => {
        const old = data.lessons.find(item => item.lessonId === lesson.lessonId);
        if (old) Object.assign(old, lesson);
        data.completedLessons = data.lessons.filter(item => item.completed).length;
      })),
    });
    current.current = { key, controller };
    const timer = setInterval(() => controller.tick(), 10000);
    return () => { clearInterval(timer); controller.dispose(); if (current.current?.controller === controller) current.current = null; };
  }, [courseId, sectionId, lessonId, key, start, heartbeat, dispatch]);
  const controls = useMemo(() => {
    const invoke = (name, data) => { if (current.current?.key === key) current.current.controller[name](data?.currentTime); };
    return { update: data => invoke("update", data), play: data => invoke("play", data), pause: data => invoke("pause", data), seek: data => invoke("seek", data), retry: () => invoke("retry") };
  }, [key]);
  return { ...controls, status, error };
}
