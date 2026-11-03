import { useSelector } from "react-redux";
import { Check, CheckCircle2, CircleAlert, FileVideo, X } from "lucide-react";
import Spinner from "@/components/feedback/Spinner.jsx";
import { videoErrorMessage } from "@/lib/user-messages.js";
import { videoProgressState, videoFileSize } from "./video-progress.js";

export default function VideoProgress({ video, phase, progress, file, unconfirmed, accepted, onClear }) {
  const live = useSelector(state => state.realtime?.connected === true);
  const state = videoProgressState({ status: video?.status, phase, progress, hasFile: Boolean(file), unconfirmed, accepted });
  if (!state) return null;
  const filename = file?.name || video?.originalFileName;
  const size = videoFileSize(file?.size || video?.fileSize);
  return <section className="cw-transfer" data-state={state.failed ? "failed" : state.complete ? "ready" : "pending"} aria-label="Video upload and preparation">
    {filename && <div className="cw-transfer-file"><FileVideo size={18} aria-hidden="true" /><div><strong>{filename}</strong>{size && <span>{size}</span>}</div>{file && onClear && <button type="button" className="cw-actions-trigger" aria-label="Clear selected video" title="Cancel selection" onClick={onClear}><X size={14} aria-hidden="true" /></button>}</div>}
    <div className="cw-transfer-heading">{state.active && state.removing ? <Spinner size={18} decorative /> : state.complete ? <CheckCircle2 size={19} aria-hidden="true" /> : state.failed ? <CircleAlert size={19} aria-hidden="true" /> : <FileVideo size={18} aria-hidden="true" />}<strong role="status">{state.title}</strong></div>
    <p>{state.failed ? videoErrorMessage(video?.lastError) : state.description}</p>
    {state.percent !== undefined && <><div className="cw-transfer-percent"><span>File upload</span><strong>{state.percent}%</strong></div><progress className="cw-transfer-progress" value={state.percent} max={100} aria-label="File upload progress" /></>}
    {state.indeterminate && <div className="cw-transfer-indeterminate" role="progressbar" aria-label={state.title} aria-valuemin={0} aria-valuemax={100} aria-valuetext={state.description}><span /></div>}
    {!state.removing && <ol className="cw-transfer-steps" aria-label="Video preparation steps">{["Upload", "Prepare", "Ready"].map((label, index) => {
      const done = state.complete || index < state.stage;
      return <li key={label} data-state={done ? "done" : index === state.stage ? state.failed ? "failed" : "current" : "next"} data-active={Boolean(state.active && !done && index === state.stage)} aria-current={!state.complete && index === state.stage ? "step" : undefined}>
        <span className="cw-transfer-number" aria-hidden="true">{done ? <Check size={13} strokeWidth={2} /> : index + 1}</span>
        <span>{label}<span className="sr-only">{done ? ": complete" : index === state.stage ? state.failed ? ": needs attention" : ": current step" : ": not started"}</span></span>
        {index < 2 && <span className="cw-transfer-connector" data-complete={done} aria-hidden="true" />}
      </li>;
    })}</ol>}
    {state.active && state.stage === 1 && !phase && <span className="cw-transfer-live">{live ? "Status updates live" : "Status refreshes automatically"} · You can leave this page.</span>}
    {state.complete && video?.hls?.qualities?.length > 0 && <span className="cw-transfer-live">Available in {video.hls.qualities.map(item => item.quality).join(", ")}</span>}
  </section>;
}
