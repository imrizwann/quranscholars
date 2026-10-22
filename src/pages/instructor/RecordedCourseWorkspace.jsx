import { useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { useCreateSectionMutation, useCreateLessonMutation, useDeleteCourseMutation, useDeleteSectionMutation, useDeleteLessonMutation, useDeleteVideoMutation } from "@/services/api/instructor/recordedCoursesApi.js";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import {
  courseIsPending,
  lessonsArePending,
  readableError,
} from "@/features/instructor-courses/courseApi.js";
import {
  Pagination,
  QueryMessage,
  VideoStatus,
} from "@/features/instructor-courses/WorkspaceParts.jsx";
import {
  ArrowLeft,
  ChevronRight,
  FolderOpen,
  Layers,
  Plus,
  RefreshCw,
  Trash2,
  Video,
} from "lucide-react";
import Spinner from "@/components/feedback/Spinner.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel.jsx";
import VideoUploadPanel from "@/features/instructor-courses/VideoUploadPanel.jsx";
import "@/features/instructor-courses/course-workspace.css";

function AddTitleForm({ label, disabled, loading, onCreate }) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="cw-add-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled || loading) return;
        if (await onCreate(title.trim())) setTitle("");
      }}
    >
      <label>
        {label} title
        <input
          required
          minLength={3}
          maxLength={150}
          placeholder={
            label === "Section"
              ? "e.g. Getting started"
              : "e.g. Introduction to Tajweed"
          }
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={disabled}
        />
      </label>
      <AsyncButton
        type="submit"
        className="cw-button cw-primary"
        loading={loading}
        loadingLabel={`Adding ${label.toLowerCase()}`}
        disabled={disabled || title.trim().length < 3}
      >
        <Plus size={16} aria-hidden="true" />
        Add {label.toLowerCase()}
      </AsyncButton>
    </form>
  );
}

// A keyed inner component clears transient files/requests when the course changes.
export default function RecordedCourseWorkspace() {
  const { courseId } = useParams();
  return <Workspace key={courseId} courseId={courseId} />;
}

function Workspace({ courseId }) {
  const navigate = useNavigate();
  const base = `/${encodeURIComponent(courseId)}`;
  const course = useCourseQuery("getCourse", { courseId }, courseIsPending);
  const [createSection] = useCreateSectionMutation();
  const [createLesson] = useCreateLessonMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const [deleteSection] = useDeleteSectionMutation();
  const [deleteLesson] = useDeleteLessonMutation();
  const [deleteVideo] = useDeleteVideoMutation();
  const [sectionPage, setSectionPage] = useState(1);
  const [lessonPage, setLessonPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const sections = useCourseQuery("getSections", { courseId, page: sectionPage }, undefined, !course.data);
  const lessons = useCourseQuery("getLessons", { courseId, sectionId: selected?._id, page: lessonPage }, lessonsArePending, !selected || !course.data);
  const [busy, updateBusy] = useState(false);
  const busyRef = useRef(false);
  function setBusy(value) {
    busyRef.current = value;
    updateBusy(value);
  }
  const [pendingAction, setPendingAction] = useState("");
  const [error, setError] = useState("");
  const [deletions, setDeletions] = useState([]);
  const [deletion, setDeletion] = useState(null);
  const saving = useRef(false);
  const blocker = useBlocker(() => busyRef.current);
  useEffect(() => {
    if (!busy) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  function refresh() {
    course.refresh();
    sections.refresh();
    lessons.refresh();
  }
  async function create(kind, title) {
    const path = kind === "section" ? `${base}/sections` : `${base}/sections/${selected._id}/lessons`;
    if (saving.current || busy) return false;
    saving.current = true;
    setBusy(true);
    setPendingAction(`create:${path}`);
    setError("");
    try {
      const request = kind === "section" ? createSection({ courseId, title }) : createLesson({ courseId, sectionId: selected._id, title });
      await request.unwrap();
      return true;
    } catch (failure) {
      setError(readableError(failure));
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
      setPendingAction("");
    }
  }
  function remove(path, label, target = { courseId }) {
    if (saving.current || busyRef.current) return;
    setDeletion({ path, label, target });
  }
  async function confirmDeletion() {
    if (!deletion || saving.current || busyRef.current) return;
    const { path, label, target } = deletion;
    setDeletion(null);
    saving.current = true;
    setBusy(true);
    setPendingAction(`delete:${path}`);
    setError("");
    try {
      const mutations = { course: deleteCourse, section: deleteSection, lesson: deleteLesson, video: deleteVideo };
      const result = await mutations[label](target).unwrap();
      if (label === "course") {
        // Finish the local operation before navigating through the upload guard.
        setBusy(false);
        navigate(`/instructor/courses/deletions/${result.deletionId}`);
      } else {
        setDeletions((previous) =>
          [{ ...result, label }, ...previous].slice(0, 10),
        );
        if (label === "section") {
          setSelected(null);
          setLessonPage(1);
        }
      }
    } catch (failure) {
      setError(readableError(failure));
    } finally {
      saving.current = false;
      setBusy(false);
      setPendingAction("");
    }
  }

  const data = course.data?.course;
  const refreshing = course.loading || sections.loading || lessons.loading;
  const sectionPath = selected ? `${base}/sections/${selected._id}` : null;
  return (
    <main className="course-workspace">
      <Link className="cw-back" to="/instructor/courses">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to courses
      </Link>
      <header className="cw-heading cw-row cw-between">
        <div>
          <p className="cw-eyebrow">Course studio</p>
          <h1>{data?.title || "Your course workspace"}</h1>
          <p className="cw-muted">
            Build your curriculum and manage your course videos.
          </p>
        </div>
        <AsyncButton
          className="cw-button"
          disabled={busy}
          loading={refreshing}
          loadingLabel="Refreshing"
          onClick={refresh}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </AsyncButton>
      </header>
      {data && (
        <div className="cw-course-meta">
          <span className="cw-status">{data.status}</span>
          <span>
            Video progress updates automatically while this page is open.
          </span>
        </div>
      )}
      <QueryMessage query={course} label="Loading your course" />
      {error && (
        <p className="cw-error" role="alert">
          {error}
        </p>
      )}
      {deletions.length > 0 && (
        <aside className="cw-card" aria-label="Recent deletions">
          <h2>Recent deletions</h2>
          <p className="cw-muted">
            Removed from the course. Files are being removed in the background.
          </p>
          {deletions.map((item) => (
            <p key={item.deletionId}>
              <Link
                className="cw-text-link"
                to={`/instructor/courses/deletions/${item.deletionId}`}
              >
                View {item.label} deletion
              </Link>
            </p>
          ))}
        </aside>
      )}
      {data && (
        <>
          <CollapsiblePanel className="cw-card" label="course trailer"
            actions={<VideoStatus video={data.trailerVideo} />}
            heading={<div className="cw-card-heading">
              <span className="cw-heading-icon">
                <Video size={21} aria-hidden="true" />
              </span>
              <div>
                <h2>Course trailer</h2>
                <p className="cw-muted">
                  Give learners a short introduction to your course.
                </p>
              </div>
            </div>}>
            <VideoUploadPanel
              path={`${base}/trailer`}
              target={{ courseId }}
              video={data.trailerVideo}
              disabled={busy || Boolean(course.error)}
              deleting={pendingAction === `delete:${base}/trailer`}
              onBusy={setBusy}
              onChanged={course.refresh}
              onDelete={remove}
            />
          </CollapsiblePanel>
          <div className="cw-curriculum-heading">
            <div>
              <p className="cw-eyebrow">Build your curriculum</p>
              <h2>Sections & lessons</h2>
            </div>
            <p className="cw-muted">
              Organize your course into manageable steps.
            </p>
          </div>
          <div className="cw-grid">
            <section className="cw-card cw-sections">
              <div className="cw-card-heading">
                <span className="cw-heading-icon">
                  <Layers size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2>Sections</h2>
                  <p className="cw-muted">Choose a section to manage.</p>
                </div>
              </div>
              <QueryMessage query={sections} label="Loading sections" />
              <div className="cw-stack">
                {sections.data?.items.map((section) => (
                  <button
                    className="cw-button cw-section"
                    key={section._id}
                    aria-pressed={selected?._id === section._id}
                    aria-busy={
                      (selected?._id === section._id && lessons.loading) ||
                      undefined
                    }
                    disabled={busy}
                    onClick={() => {
                      setSelected(section);
                      setLessonPage(1);
                    }}
                  >
                    <span className="cw-section-number">{section.order}</span>
                    <span>{section.title}</span>
                    {selected?._id === section._id && lessons.loading ? (
                      <Spinner size={16} decorative />
                    ) : (
                      <ChevronRight size={16} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
              {sections.data?.items.length === 0 && (
                <div className="cw-empty">
                  <Layers size={26} aria-hidden="true" />
                  <p>Add your first section to start organizing your course.</p>
                </div>
              )}
              <Pagination
                pagination={sections.data?.pagination}
                page={sectionPage}
                disabled={busy}
                loading={sections.loading}
                onPage={(page) => {
                  setSectionPage(page);
                  setSelected(null);
                }}
              />
              <AddTitleForm
                label="Section"
                loading={pendingAction === `create:${base}/sections`}
                disabled={
                  busy || Boolean(course.error) || Boolean(sections.error)
                }
                onCreate={(title) => create("section", title)}
              />
            </section>
            <section className="cw-card cw-lessons">
              <div className="cw-row cw-between cw-item-heading">
                <div>
                  <p className="cw-eyebrow">
                    {selected ? "Selected section" : "Lesson workspace"}
                  </p>
                  <h2>{selected?.title || "Your lessons"}</h2>
                </div>
                {selected && (
                  <AsyncButton
                    className="cw-button cw-danger cw-icon-button"
                    aria-label={`Delete section: ${selected.title}`}
                    title="Delete section"
                    loading={pendingAction === `delete:${sectionPath}`}
                    loadingLabel={<span className="sr-only">Deleting section</span>}
                    disabled={
                      busy || Boolean(lessons.error) || Boolean(course.error)
                    }
                    onClick={() => remove(sectionPath, "section", { courseId, sectionId: selected._id })}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </AsyncButton>
                )}
              </div>
              {!selected ? (
                <div className="cw-empty cw-empty-large">
                  <FolderOpen size={34} strokeWidth={1.5} aria-hidden="true" />
                  <h3>A place for every lesson</h3>
                  <p>
                    Select a section to add lessons and upload their videos.
                  </p>
                </div>
              ) : (
                <>
                  <QueryMessage query={lessons} label="Loading lessons" />
                  {lessons.data?.items.map((lesson) => (
                    <CollapsiblePanel as="article" key={lesson._id} className="cw-lesson"
                      label={`lesson: ${lesson.title}`}
                      heading={<div className="cw-lesson-title">
                          <span className="cw-section-number">
                            {lesson.order}
                          </span>
                          <h3>{lesson.title}</h3>
                        </div>}
                      actions={<>
                        <VideoStatus video={lesson.video} />
                        <AsyncButton
                          className="cw-button cw-danger cw-icon-button"
                          aria-label={`Delete lesson: ${lesson.title}`}
                          title="Delete lesson"
                          loading={
                            pendingAction ===
                            `delete:${sectionPath}/lessons/${lesson._id}`
                          }
                          loadingLabel={<span className="sr-only">Deleting lesson</span>}
                          disabled={
                            busy ||
                            Boolean(lessons.error) ||
                            Boolean(course.error)
                          }
                          onClick={() =>
                            remove(
                              `${sectionPath}/lessons/${lesson._id}`,
                              "lesson",
                              { courseId, sectionId: selected._id, lessonId: lesson._id },
                            )
                          }
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </AsyncButton>
                      </>}>
                      <VideoUploadPanel
                        path={`${sectionPath}/lessons/${lesson._id}/video`}
                        target={{ courseId, sectionId: selected._id, lessonId: lesson._id }}
                        video={lesson.video}
                        deleting={
                          pendingAction ===
                          `delete:${sectionPath}/lessons/${lesson._id}/video`
                        }
                        disabled={
                          busy ||
                          Boolean(lessons.error) ||
                          Boolean(course.error)
                        }
                        onBusy={setBusy}
                        onChanged={lessons.refresh}
                        onDelete={remove}
                      />
                    </CollapsiblePanel>
                  ))}
                  {lessons.data?.items.length === 0 && (
                    <div className="cw-empty">
                      <Video size={28} aria-hidden="true" />
                      <p>
                        No lessons yet. Add a title below, then upload your
                        video.
                      </p>
                    </div>
                  )}
                  <Pagination
                    pagination={lessons.data?.pagination}
                    page={lessonPage}
                    onPage={setLessonPage}
                    disabled={busy}
                    loading={lessons.loading}
                  />
                  <AddTitleForm
                    key={selected._id}
                    label="Lesson"
                    loading={pendingAction === `create:${sectionPath}/lessons`}
                    disabled={
                      busy || Boolean(lessons.error) || Boolean(course.error)
                    }
                    onCreate={(title) =>
                      create("lesson", title)
                    }
                  />
                </>
              )}
            </section>
          </div>
          <section className="cw-card cw-danger-zone cw-row cw-between">
            <div>
              <h2>Delete course</h2>
              <p className="cw-muted">
                Permanently remove this course, its sections, lessons and
                videos.
              </p>
            </div>
            <AsyncButton
              className="cw-button cw-danger cw-button-compact"
              loading={pendingAction === `delete:${base}`}
              loadingLabel="Deleting"
              disabled={busy || Boolean(course.error)}
              onClick={() => remove(base, "course")}
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete course
            </AsyncButton>
          </section>
        </>
      )}
      <ConfirmationModal
        open={Boolean(deletion)}
        title={`Delete this ${deletion?.label || "item"}?`}
        description={`${deletion?.label === "course" ? "The course, its sections, lessons and videos will be removed. " : deletion?.label === "section" ? "This section and all its lessons and videos will be removed. " : deletion?.label === "lesson" ? "This lesson and its video will be removed. " : "This video will be removed. "}This cannot be undone.`}
        confirmLabel={`Delete ${deletion?.label || "item"}`}
        danger
        onCancel={() => setDeletion(null)}
        onConfirm={confirmDeletion}
      />
      <ConfirmationModal
        open={blocker.state === "blocked"}
        title="Leave this page?"
        description="Your changes are still being saved. Leaving will cancel any active upload. Check your course when you return."
        confirmLabel="Leave page"
        cancelLabel="Stay on page"
        danger
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </main>
  );
}
