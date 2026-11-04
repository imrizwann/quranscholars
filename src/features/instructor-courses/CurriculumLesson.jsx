import { useState } from "react";
import { Pencil, Trash2, VideoOff } from "lucide-react";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel.jsx";
import CurriculumActions from "./CurriculumActions.jsx";
import LessonTitleEditor from "./LessonTitleEditor.jsx";
import VideoUploadPanel from "./VideoUploadPanel.jsx";
import { VideoStatus } from "./WorkspaceParts.jsx";

export default function CurriculumLesson({ lesson, index, target, path, disabled, protectedPublished = false, deleting, removingVideo, onBusy, onEditing, onRefresh, onRemove }) {
  const [open, setOpen] = useState(index === 0);
  const [editing, setEditing] = useState(false);
  const [activity, setActivity] = useState(null);
  function changeEditing(value) {
    setEditing(value); onEditing(value);
    if (value) setOpen(true);
  }
  return <CollapsiblePanel as="article" className="cw-lesson" label={`lesson: ${lesson.title}`} open={open} onOpenChange={setOpen}
    heading={<div className="cw-lesson-title"><span className="cw-section-number">{index + 1}</span><h3>{lesson.title}</h3></div>}
    actions={<VideoStatus video={lesson.video} activity={activity} />}
    endActions={<CurriculumActions label={`Lesson actions: ${lesson.title}`} disabled={disabled || editing} loading={deleting || removingVideo} items={[
      { label: "Edit lesson", icon: Pencil, onClick: () => changeEditing(true) },
      lesson.video?.status && lesson.video.status !== "NOT_UPLOADED" && { label: "Remove video", icon: VideoOff, danger: true, disabled: protectedPublished, onClick: () => onRemove(`${path}/video`, "video", target) },
      { label: "Delete lesson", icon: Trash2, danger: true, disabled: protectedPublished, onClick: () => onRemove(path, "lesson", target) },
    ]} />}>
    <LessonTitleEditor key={editing ? "editing" : "view"} lesson={lesson} editing={editing} target={target} disabled={disabled} onBusy={onBusy} onEditing={changeEditing} />
    <VideoUploadPanel path={`${path}/video`} target={target} video={lesson.video} deleting={removingVideo} disabled={disabled || editing || protectedPublished} onBusy={onBusy} onChanged={onRefresh} onDelete={onRemove} showRemoveAction={false} onActivityChange={setActivity} />
  </CollapsiblePanel>;
}
