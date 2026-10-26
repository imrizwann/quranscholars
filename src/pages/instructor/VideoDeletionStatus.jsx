import { Link, useParams } from "react-router-dom";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import { deletionIsPending } from "@/features/instructor-courses/courseApi.js";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import "@/features/instructor-courses/course-workspace.css";

export default function VideoDeletionStatus() {
  const { deletionId } = useParams();
  const query = useCourseQuery("getDeletion", { deletionId }, deletionIsPending);
  const data = query.data;
  const blocked = data?.status === "blocked";
  return (
    <main className="course-workspace">
      <Link className="cw-back" to="/instructor/courses">Back to courses</Link>
      <h1>Deletion status</h1>
      <p className="cw-muted">The course item is removed immediately. Its files are cleaned up in the background.</p>
      <section className="cw-card">
        <QueryMessage query={query} label="Checking deletion status" />
        {data && <div role="status">
          <h2>{blocked ? "Removal needs attention" : data.status === "completed" ? "Deletion complete" : data.status === "retrying" ? "Removing remaining files" : "Removing files"}</h2>
          <p>{blocked ? "This item is no longer available, but we could not remove all its files. Please contact support to finish removing them." : data.storageCleanupPending ? "Files are being removed. You can safely leave this page and check back later." : "This item and its files have been deleted."}</p>
          {data.completedAt && <p className="cw-muted">Completed: {new Date(data.completedAt).toLocaleString()}</p>}
        </div>}
      </section>
      <AsyncButton className="cw-button" style={{ marginTop: 16 }} loading={query.loading} loadingLabel="Refreshing" onClick={query.refresh}>Refresh</AsyncButton>
    </main>
  );
}
