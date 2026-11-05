import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

test("the classroom waits for account resume, chooses the last watched lesson, and never jumps after a background refresh", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "Event", "MouseEvent", "localStorage"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const output = resolve("tests", `lesson-resume-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, apis;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Player} from './src/pages/recorded-courses/RecordedCoursePlayer.jsx'; export {default as ProtectedVideo} from './src/features/recorded-courses/components/ProtectedLessonVideo.jsx'; export {default as learnerApi} from './src/services/api/user/learnerApi.js'; export {default as paymentApi} from './src/services/api/user/paymentApi.js'; export {default as instructorApi} from './src/services/api/instructor/recordedCoursesApi.js'; export {saveLastLesson, saveLessonStudy} from './src/features/recorded-courses/services/lessonStudyStorage.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) }, plugins: [{ name: "resume-player-boundary", setup(builder) {
      builder.onLoad({ filter: /components[\\/]video-player[\\/]VideoPlayer\.jsx$/ }, () => ({ loader: "jsx", contents: `import React, {useEffect,useRef,useState} from 'react'; export default function Player(props) { const [,update]=useState(0); const native=useRef({currentTime:0,duration:300,canPlay:false,play:()=>Promise.resolve()}); useEffect(()=>{props.playerRef.current=native.current;},[props.playerRef]); return <div className="resume-player" data-title={props.title} data-time={native.current.currentTime}><button onClick={()=>props.onPlay()}>Play before ready</button><button onClick={()=>{native.current.canPlay=true;props.onCanPlay();update(x=>x+1);}}>Media ready</button></div>;}` }));
      builder.onLoad({ filter: /WorkspaceAccountMenu\.jsx$/ }, () => ({ loader: "jsx", contents: `export default function AccountMenu(){return null;}` }));
    } }] });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); apis = [mod.learnerApi, mod.paymentApi, mod.instructorApi];
    store = configureStore({ reducer: { user: () => ({ user: { _id: "account1", role: "user" } }), ...Object.fromEntries(apis.map(api => [api.reducerPath, api.reducer])) }, middleware: defaults => defaults().concat(...apis.map(api => api.middleware)) });
    const course = { _id: "course1", slug: "resume-course", title: "Resume course", language: "English", level: "Beginner", instructor: { _id: "teacher1", name: "Your instructor" }, sections: [{ _id: "section1", title: "First section", order: 1, lessons: [1, 2].map(number => ({ _id: `lesson${number}`, sectionId: "section1", title: `Lesson ${number}`, order: number, durationSeconds: 300 })) }] };
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let state = { lastLessonId: "lesson2", completedLessons: 0, totalLessons: 2, lessons: [{ lessonId: "lesson1", sectionId: "section1", duration: 300, lastPosition: 60, completed: false }, { lessonId: "lesson2", sectionId: "section1", duration: 300, lastPosition: 120, completed: false }], sections: [{ sectionId: "section1", completedLessons: 0, totalLessons: 2, quiz: null }] };
    globalThis.fetch = async request => {
      const path = new URL(request.url).pathname;
      if (path.includes("/courses/by-slug/")) return Response.json({ success: true, data: { course, canManage: false } });
      if (path.endsWith("/access")) return Response.json({ success: true, data: { canAccessCourse: true } });
      if (path.endsWith("/playback")) return Response.json({ success: true, data: { playbackUrl: "https://video.example.test/lesson/run/master.m3u8", playbackToken: "header.payload.signature", expiresAt: new Date(Date.now() + 600000).toISOString() } });
      assert(path.endsWith("/progress"), `Unexpected request ${path}`);
      await gate; return Response.json({ success: true, data: state });
    };
    mod.saveLastLesson("account1", "course1", "lesson1");
    mod.saveLessonStudy("account1", "course1", "lesson2", { position: 12 });
    const { createRoot } = await import("react-dom/client");
    const { MemoryRouter, Routes, Route } = await import("react-router-dom");
    root = createRoot(document.getElementById("root"));
    const render = (path, key) => act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { key, initialEntries: [path] }, React.createElement(Routes, null, React.createElement(Route, { path: "/learn/:courseSlug/:lessonId?", element: React.createElement(mod.Player) }))))));
    const settle = async condition => {
      for (let i = 0; i < 150; i++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    await render("/learn/resume-course", "first-visit");
    await settle(() => document.body.textContent.includes("Restoring your lesson"));
    assert.equal(document.querySelector(".resume-player"), null, "a late progress response must not initialize the player at zero");
    await act(async () => release());
    await settle(() => document.querySelector(".resume-player"));
    const mediaReady = () => [...document.querySelectorAll("button")].find(button => button.textContent === "Media ready");
    await act(async () => mediaReady().click());
    assert.equal(document.querySelector(".resume-player").dataset.title, "Lesson 2");
    assert.equal(document.querySelector(".resume-player").dataset.time, "120");
    state = { ...state, lastLessonId: "lesson1", lessons: state.lessons.map(lesson => lesson.lessonId === "lesson2" ? { ...lesson, lastPosition: 180 } : lesson) };
    await act(async () => store.dispatch(mod.learnerApi.util.invalidateTags([{ type: "LearningProgress", id: "course1" }])));
    await settle(() => mod.learnerApi.endpoints.getCourseProgress.select("course1")(store.getState()).data.lessons[1].lastPosition === 180);
    assert.equal(document.querySelector(".resume-player").dataset.time, "120");
    assert.equal(document.querySelector(".resume-player").dataset.title, "Lesson 2");
    localStorage.clear();
    await render("/learn/resume-course/lesson1", "new-device");
    await settle(() => document.querySelector(".resume-player")?.dataset.title === "Lesson 1");
    await act(async () => mediaReady().click());
    assert.equal(document.querySelector(".resume-player").dataset.time, "60", "a direct lesson URL restores account progress without browser history");
    const plays = [];
    const target = { courseId: "course1", sectionId: "section1", lessonId: "lesson2" };
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(mod.ProtectedVideo, { key: "early-play", target, title: "Early play", startTime: 120, onPlaybackPlay: value => plays.push(value.currentTime) }))));
    await settle(() => document.querySelector(".resume-player")?.dataset.title === "Early play");
    await act(async () => [...document.querySelectorAll("button")].find(button => button.textContent === "Play before ready").click());
    assert.deepEqual(plays, [], "a loading player cannot overwrite resume with zero");
    await act(async () => mediaReady().click());
    assert.deepEqual(plays, [120]); assert.equal(document.querySelector(".resume-player").dataset.time, "120");
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && apis) for (const api of apis) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    await new Promise(resolve => setTimeout(resolve, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
});
