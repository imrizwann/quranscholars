import { Link, useParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import Spinner from "@/components/feedback/Spinner.jsx";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import { deletionIsPending } from "@/features/instructor-courses/courseApi.js";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import "@/features/instructor-courses/course-workspace.css";

export default function VideoDeletionStatus() {
  const { deletionId } = useParams();
  const query = useCourseQuery("getDeletion", { deletionId }, deletionIsPending);
  const data = query.data;
  const blocked = data?.status === "blocked";
  const complete = data?.status === "completed";
  const pending = Boolean(data) && !blocked && !complete;
  return <main className="course-workspace">
    <Link className="cw-back" to="/instructor/courses">Back to courses</Link>
    <h1>Removal status</h1>
    <section className="cw-card">
      <QueryMessage query={query} label="Checking removal progress" />
      {data && <div role={blocked ? "alert" : "status"} aria-live="polite">
        <div className="cw-row">
          {blocked ? <AlertTriangle size={24} className="text-destructive" aria-hidden="true" /> : complete ? <CheckCircle2 size={24} className="text-primary" aria-hidden="true" /> : <Spinner size={24} decorative />}
          <h2>{blocked ? "Removal needs attention" : complete ? "Deletion complete" : data.status === "retrying" ? "Retrying file removal" : "Removing files"}</h2>
        </div>
        <p className="cw-muted mt-3">{blocked ? "This item is no longer available, but some files could not be removed. Contact our team to finish the cleanup." : complete ? "This item and its associated files have been deleted." : "Your deletion request was accepted. The item is no longer available, and its files are being removed. You can safely leave this page."}</p>
        {pending && <p className="cw-muted mt-3">This page updates automatically while removal is in progress.</p>}
        {complete && data.completedAt && <p className="cw-muted mt-3">Completed: {new Date(data.completedAt).toLocaleString()}</p>}
        {blocked && <div className="cw-row mt-4"><Link to="/contact" className="cw-button">Contact support</Link><span className="cw-muted break-all">Reference: {deletionId}</span></div>}
      </div>}
    </section>
    <div className="cw-row mt-4"><Link className="cw-button" to="/instructor/courses">Return to courses</Link><AsyncButton className="cw-button" loading={query.loading} loadingLabel="Checking" onClick={query.refresh}>Refresh status</AsyncButton></div>
  </main>;
}
