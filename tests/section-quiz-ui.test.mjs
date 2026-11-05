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

async function fixture(run) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const output = resolve("tests", `section-quiz-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, apis;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Curriculum} from './src/features/recorded-courses/components/LearningCurriculum.jsx'; export {default as Quiz} from './src/features/recorded-courses/components/SectionQuizPanel.jsx'; export {default as useWatch} from './src/features/recorded-courses/useLessonWatch.js'; export {default as Editor} from './src/features/instructor-courses/SectionQuizEditor.jsx'; export {default as Publishing} from './src/features/instructor-courses/CoursePublishing.jsx'; export {default as learnerApi, useGetCourseProgressQuery} from './src/services/api/user/learnerApi.js'; export {default as instructorApi} from './src/services/api/instructor/recordedCoursesApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); apis = [mod.learnerApi, mod.instructorApi];
    store = configureStore({ reducer: { user: () => ({ user: { _id: "account1", role: "instructor" } }), ...Object.fromEntries(apis.map(api => [api.reducerPath, api.reducer])) }, middleware: defaults => defaults().concat(...apis.map(api => api.middleware)) });
    const { createRoot } = await import("react-dom/client");
    const { MemoryRouter } = await import("react-router-dom");
    root = createRoot(document.getElementById("root"));
    const render = component => act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, component))));
    const settle = async condition => {
      for (let i = 0; i < 150; i++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    await run({ mod, store, render, settle });
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && apis) for (const api of apis) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    await new Promise(resolve => setTimeout(resolve, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
}
const button = label => [...document.querySelectorAll("button")].find(item => item.textContent.includes(label));
const click = element => act(async () => element.click());
const response = data => Response.json({ success: true, data });

test("server-confirmed lesson completion immediately unlocks an optional quiz; skipping and failing preserve completion", async () => fixture(async ({ mod, store, render, settle }) => {
  const lesson = { id: "lesson1", sectionId: "section1", title: "Your first lesson", durationLabel: "2 min" };
  const section = { id: "section1", title: "Foundations", lessons: [lesson] };
  let complete = false, attempts = 5;
  const state = () => ({ completed: complete, completedLessons: complete ? 1 : 0, totalLessons: 1,
    lessons: [{ lessonId: lesson.id, sectionId: section.id, completed: complete }],
    sections: [{ sectionId: section.id, completed: complete, completedLessons: complete ? 1 : 0, totalLessons: 1, quiz: { title: "Check your understanding", required: false, questionCount: 1, passingPercent: 70, unlocked: complete, passed: false } }] });
  globalThis.fetch = async request => {
    const path = new URL(request.url).pathname;
    assert.equal(request.credentials, "include");
    if (path.endsWith("/progress")) return response(state());
    if (path.endsWith("/watch")) { complete = true; return response({ watchId: randomUUID(), sequence: 0, lesson: state().lessons[0] }); }
    if (path.endsWith("/quiz/attempts")) { attempts--; return response({ scorePercent: 0, correctCount: 0, passed: false, attemptsRemaining: attempts }); }
    assert(path.endsWith("/quiz")); assert.equal(complete, true);
    return response({ title: "Check your understanding", version: "v1", required: false, passingPercent: 70, attemptsRemaining: attempts, passed: false, questions: [{ id: "q1", prompt: "Choose a sound", options: ["First", "Second"] }] });
  };
  function Harness() {
    const progress = mod.useGetCourseProgressQuery("course1");
    const watch = mod.useWatch({ courseId: "course1", sectionId: section.id, lessonId: lesson.id });
    const [quiz, setQuiz] = React.useState(false);
    return React.createElement(React.Fragment, null,
      React.createElement("button", { onClick: () => watch.play({ currentTime: 100 }) }, "Save lesson progress"),
      React.createElement(mod.Curriculum, { course: { slug: "foundations" }, sections: [section], lesson, lessons: [lesson], learningState: progress.currentData, progressLoading: progress.isLoading, onQuiz: () => setQuiz(true) }),
      quiz && React.createElement(mod.Quiz, { courseId: "course1", sectionId: section.id, onDone: () => setQuiz(false) }));
  }
  await render(React.createElement(Harness));
  await settle(() => document.querySelector(".learning-quiz-link"));
  assert.equal(document.querySelector(".learning-quiz-link").disabled, true);
  assert.match(document.querySelector(".learning-quiz-link").textContent, /Optional/);
  await click(button("Save lesson progress"));
  await settle(() => document.querySelector(".learning-quiz-link").disabled === false);
  assert.match(document.body.textContent, /Section complete/);
  await click(document.querySelector(".learning-quiz-link")); await settle(() => document.querySelector(".learning-quiz-note"));
  assert.match(document.querySelector(".learning-quiz-note").textContent, /without taking or passing/);
  await click(button("Skip quiz"));
  await settle(() => !document.querySelector(".learning-quiz-note"));
  assert.equal(mod.learnerApi.endpoints.getCourseProgress.select("course1")(store.getState()).data.completed, true);
  await click(document.querySelector(".learning-quiz-link")); await settle(() => document.querySelector('input[type="radio"]'));
  await click(document.querySelector('input[type="radio"]'));
  await click(button("Review"));
  await click(button("Submit answers")); await settle(() => document.body.textContent.includes("Keep practicing"));
  assert.match(document.body.textContent, /section and course completion are unchanged/);
  assert.equal(mod.learnerApi.endpoints.getCourseProgress.select("course1")(store.getState()).data.completed, true);
}));

test("one-question quiz navigation preserves answers, reviews skipped questions and safely retries the same submission", async () => fixture(async ({ mod, render, settle }) => {
  const questions = [1, 2, 3].map(number => ({ id: `q${number}`, prompt: `Question prompt ${number}`, options: ["First answer", "Second answer"] }));
  const writes = [];
  let resolveFirst, passed = false, skipped = false;
  globalThis.fetch = async request => {
    if (request.method === "POST") {
      writes.push(await request.json());
      if (writes.length === 1) return new Promise(resolve => { resolveFirst = () => resolve(Response.json({ userMessage: "Please try again." }, { status: 500 })); });
      passed = true;
      return response({ scorePercent: 100, correctCount: 3, passed: true, attemptsRemaining: 4 });
    }
    return response({ title: "Practice quiz", version: "v1", passingPercent: 70, attemptsRemaining: 5, passed, questions });
  };
  await render(React.createElement(mod.Quiz, { courseId: "course1", sectionId: "section1", onDone: () => { skipped = true; } }));
  await settle(() => document.querySelector(".learning-quiz-question"));
  const next = () => document.querySelector('button[aria-label="Next question"]');
  const choose = index => click(document.querySelectorAll('.learning-quiz-question input[type="radio"]')[index]);
  const review = () => document.querySelector('button[aria-label="Review answers"]');
  assert.equal(document.querySelectorAll("fieldset").length, 1);
  assert.equal(button("Previous").disabled, true); assert.equal(next().disabled, true);
  assert.match(document.body.textContent, /Question 1 of 3/);
  await click(button("Skip quiz")); assert.equal(skipped, true); assert.equal(writes.length, 0);
  await act(async () => document.querySelector("form.learning-quiz").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(writes.length, 0, "Enter cannot bypass question review or submit an incomplete quiz");
  await click(button("Skip for now"));
  assert.match(document.body.textContent, /Question 2 of 3/);
  assert.equal(document.activeElement, document.querySelector("legend"));
  await choose(1); await click(next());
  assert.match(document.body.textContent, /Question 3 of 3/);
  await click(button("Previous"));
  assert.equal(document.querySelectorAll('input[type="radio"]')[1].checked, true);
  await click(next()); await choose(0); await click(review());
  assert.match(document.body.textContent, /1 question still needs an answer/);
  assert.equal(button("Submit answers").disabled, true); assert.equal(writes.length, 0);
  await click(document.querySelector('button[aria-label="Question 1: not answered"]'));
  await choose(0); await click(next());
  assert.equal(document.querySelectorAll('input[type="radio"]')[1].checked, true);
  await click(next()); assert.equal(document.querySelector('input[type="radio"]').checked, true);
  await click(review());
  assert.match(document.body.textContent, /Every question is answered/);
  await click(button("Submit answers"));
  await settle(() => resolveFirst);
  assert.equal(button("Previous").disabled, true); assert.equal(button("Checking answers").disabled, true);
  assert.equal(button("Back to lessons").disabled, true);
  await click(button("Checking answers")); assert.equal(writes.length, 1);
  await act(async () => resolveFirst());
  await settle(() => button("Retry submission") && !button("Retry submission").disabled);
  await click(button("Retry submission"));
  await settle(() => document.body.textContent.includes("Section quiz passed"));
  assert.equal(writes.length, 2); assert.deepEqual(writes[0], writes[1]);
  assert.deepEqual(writes[0].answers, [{ questionId: "q1", optionIndex: 0 }, { questionId: "q2", optionIndex: 1 }, { questionId: "q3", optionIndex: 0 }]);
}));

test("publishing review exposes hidden draft quizzes and saving a published quiz refreshes readiness", async () => fixture(async ({ mod, render, settle }) => {
  let published = false, readinessReads = 0;
  const writes = [];
  const quiz = () => ({ title: "Section check", version: "v1", published, passingPercent: 70, questions: [{ prompt: "Choose a sound", options: ["First", "Second"], correctOption: 1 }] });
  globalThis.fetch = async request => {
    const path = new URL(request.url).pathname;
    if (path.endsWith("/readiness")) { readinessReads++; return response({ ready: true, checks: [], quizCounts: { published: published ? 1 : 0, draft: published ? 0 : 1 } }); }
    assert(path.endsWith("/quiz"));
    if (request.method === "PUT") { const body = await request.json(); writes.push(body); published = body.published; }
    return response(quiz());
  };
  await render(React.createElement(React.Fragment, null,
    React.createElement(mod.Editor, { courseId: "course1", sectionId: "section1", open: true, onOpenChange() {}, onEditing() {}, onBusy() {} }),
    React.createElement(mod.Publishing, { course: { _id: "course1", status: "Draft", published: false }, active: true, onBusy() {}, onReview() {} })));
  await settle(() => button("Save draft") && document.body.textContent.includes("1 draft"));
  assert.match(document.body.textContent, /Publishing the course does not publish draft quizzes/);
  assert.match(document.body.textContent, /Quizzes do not block course publication or learner completion/);
  assert.equal([...document.querySelectorAll("button")].find(item => item.textContent === "Publish course").disabled, false);
  await click(document.querySelector('input[name="published"]'));
  await click(button("Save and publish quiz"));
  await settle(() => document.body.textContent.includes("1 published") && document.body.textContent.includes("0 draft"));
  assert.equal(writes.length, 1); assert.equal(writes[0].published, true); assert(readinessReads >= 2);
  assert.match(document.body.textContent, /Quiz published/);
}));
