import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import api from "@/services/api/user/learnerApi.js";
import { userMessage } from "@/lib/user-messages.js";
import { NOTE_LIMIT } from "./services/lessonStudyStorage.js";
import { readNoteDraft, writeNoteDraft, clearNoteDraft, clearLegacyNotes } from "./services/lessonNoteDraft.js";

export default function useLessonNotes({ userId, courseId, lesson, active, paused }) {
  const store = useStore();
  const [opened, setOpened] = useState(active);
  useEffect(() => { if (active) setOpened(true); }, [active]);
  const target = { courseId, sectionId: lesson.sectionId, lessonId: lesson.id, accountId: userId };
  const query = api.endpoints.getLessonNote.useQuery(target, { skip: !opened || !userId, refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const [write] = api.endpoints.saveLessonNote.useMutation(), [remove] = api.endpoints.deleteLessonNote.useMutation();
  const [state, setState] = useState(() => ({ content: "", baseContent: "", revision: 0, loaded: false, deleted: false, dirty: false, status: "loading", error: "", recovery: readNoteDraft(userId, courseId, lesson.id), localSaved: true }));
  const current = useRef(state), mounted = useRef(true), request = useRef(null), denied = useRef(false), pause = useRef(paused);
  pause.current = paused;
  denied.current = [401, 403, 404].includes(Number(query.error?.status));
  const ownerActive = useCallback(() => String(store.getState().user?.user?._id || "") === userId, [store, userId]);
  const patch = useCallback(changes => {
    current.current = { ...current.current, ...changes };
    if (mounted.current) setState(current.current);
  }, []);
  const persist = useCallback((content, revision) => writeNoteDraft(userId, courseId, lesson.id, { content, revision }), [userId, courseId, lesson.id]);
  const clear = useCallback(expected => clearNoteDraft(userId, courseId, lesson.id, expected), [userId, courseId, lesson.id]);

  useEffect(() => {
    const data = query.currentData, draft = current.current;
    if (!data || request.current || data.revision < draft.revision || !ownerActive()) return;
    if (draft.loaded && data.revision === draft.revision) return;
    if (draft.loaded && draft.dirty && data.content !== draft.content) {
      patch({ status: "conflict", error: "These notes changed on another device. Download your draft or load the latest account copy." }); return;
    }
    const recovery = draft.recovery?.content === data.content ? null : draft.recovery;
    if (draft.recovery && !recovery) clear(draft.recovery);
    else if (draft.dirty && data.content === draft.content) clear({ content: draft.content, revision: draft.revision });
    patch({ content: data.content, baseContent: data.content, revision: data.revision, deleted: data.deleted, loaded: true, dirty: false, status: "saved", error: "", recovery });
  }, [query.currentData, state.status, ownerActive, patch, clear]);

  const change = useCallback(content => {
    const draft = current.current;
    if (!draft.loaded || draft.recovery || content.length > NOTE_LIMIT || draft.status === "deleting" || denied.current || !ownerActive()) return;
    const dirty = content !== draft.baseContent || Boolean(request.current);
    const localSaved = dirty ? persist(content, draft.revision) : clear({ content: draft.content, revision: draft.revision });
    patch({ content, dirty, localSaved, error: draft.status === "conflict" ? draft.error : "", status: draft.status === "conflict" ? "conflict" : request.current ? "saving" : dirty ? "pending" : "saved" });
  }, [ownerActive, persist, patch, clear]);

  const save = useCallback(async () => {
    const draft = current.current;
    if (!draft.loaded || !draft.dirty || draft.recovery || request.current || pause.current || ["conflict", "deleting", "deleteError"].includes(draft.status) || denied.current || !ownerActive()) return false;
    const sent = { content: draft.content, revision: draft.revision };
    patch({ status: "saving", error: "" });
    const pending = write({ courseId, sectionId: lesson.sectionId, lessonId: lesson.id, accountId: userId, ...sent }); request.current = pending;
    try {
      const data = await pending.unwrap();
      if (!ownerActive()) return false;
      const content = current.current.content, dirty = content !== data.content;
      const localSaved = dirty ? persist(content, data.revision) : clear(sent);
      patch({ revision: data.revision, baseContent: data.content, deleted: data.deleted, dirty, localSaved, status: dirty ? "pending" : "saved", error: "" }); return true;
    } catch (error) {
      if (ownerActive()) patch({ status: Number(error.status) === 409 ? "conflict" : "error", error: userMessage(error) });
      return false;
    } finally { if (request.current === pending) request.current = null; }
  }, [ownerActive, write, userId, courseId, lesson.sectionId, lesson.id, patch, persist, clear]);

  useEffect(() => {
    if (!state.loaded || !state.dirty || state.status !== "pending" || paused) return;
    const timer = setTimeout(() => { void save(); }, 1000);
    return () => clearTimeout(timer);
  }, [state.content, state.loaded, state.dirty, state.status, paused, save]);
  useEffect(() => {
    mounted.current = true;
    const flush = () => { void save(); };
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); mounted.current = false; void save(); };
  }, [save]);

  const loadLatest = async () => {
    if (request.current || !ownerActive()) return false;
    const discarded = current.current.recovery || { content: current.current.content, revision: current.current.revision };
    patch({ status: "loadingLatest", error: "" });
    try {
      const data = await query.refetch().unwrap();
      if (!ownerActive()) return false;
      const localSaved = clear(discarded); patch({ content: data.content, baseContent: data.content, revision: data.revision, deleted: data.deleted, recovery: null, dirty: false, loaded: true, status: "saved", localSaved }); return true;
    } catch (error) { patch({ status: "conflict", error: userMessage(error) }); return false; }
  };
  const deleteNote = async (revision = current.current.revision) => {
    if (request.current || !current.current.loaded || !ownerActive()) return false;
    patch({ status: "deleting", error: "" });
    const pending = remove({ ...target, revision, confirm: true }); request.current = pending;
    try {
      const data = await pending.unwrap();
      if (!ownerActive()) return false;
      const localSaved = clear(); patch({ content: "", baseContent: "", revision: data.revision, deleted: true, dirty: false, recovery: null, status: "saved", error: "", localSaved }); return true;
    } catch (error) { patch({ status: Number(error.status) === 409 ? "conflict" : "deleteError", error: userMessage(error) }); return false; }
    finally { if (request.current === pending) request.current = null; }
  };
  const useRecovery = (revision = current.current.revision) => {
    const draft = current.current;
    if (!draft.recovery || !draft.loaded || request.current) return false;
    if (draft.revision !== revision) { patch({ status: "conflict", error: "Your account notes changed while you were reviewing this copy. Review the latest notes before replacing them." }); return false; }
    const content = draft.recovery.content;
    const localSaved = persist(content, draft.revision) && clearLegacyNotes(userId, courseId, lesson.id, content);
    patch({ content, recovery: null, dirty: content !== draft.baseContent, status: "pending", localSaved, error: "" });
    return true;
  };
  const discardRecovery = () => { const localSaved = clear(current.current.recovery); patch({ recovery: null, localSaved, status: current.current.dirty ? "pending" : "saved", error: "" }); };
  return { ...state, query, change, save, deleteNote, loadLatest, useRecovery, discardRecovery,
    busy: ["saving", "deleting", "loadingLatest"].includes(state.status),
    canEdit: state.loaded && !state.recovery && !denied.current && !["deleting", "loadingLatest", "deleteError"].includes(state.status) };
}
