import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export default function CourseShareButton({ course }) {
  const [busy, setBusy] = useState(false);
  async function share() {
    if (busy) return;
    setBusy(true);
    const url = new URL(`/share/courses/${encodeURIComponent(course.slug)}`, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: course.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Course link copied", { description: "Share it with someone who would enjoy this course." }); }
    } catch (error) {
      if (error.name !== "AbortError") toast.error("The link could not be shared", { description: "Try again, or copy the address from your browser." });
    } finally { setBusy(false); }
  }
  return <button className="cw-button" type="button" disabled={busy} onClick={share}><Share2 size={16} aria-hidden="true" />{busy ? "Sharing…" : "Share course"}</button>;
}
