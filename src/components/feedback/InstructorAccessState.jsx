import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CircleAlert, Layers, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";

export default function InstructorAccessState({ errorMessage, onRetry, checking }) {
  const failed = Boolean(errorMessage);
  const Icon = failed ? CircleAlert : LockKeyhole;
  return (
    <main className="public-access">
      <div className="public-page">
        <Link to="/" className="public-back"><ArrowLeft size={16} aria-hidden="true" />Back to website</Link>
        <div className="public-access-grid">
          <section className="public-panel" aria-labelledby="access-title">
            <span className="public-icon"><Icon size={22} aria-hidden="true" /></span>
            <header className="public-heading">
              <p className="public-eyebrow">Instructor workspace</p>
              <h1 id="access-title">{failed ? "We couldn’t check your access." : "Instructor access required"}</h1>
              <p>{failed ? "We need to verify your account before opening the workspace." : "This workspace is available to instructor accounts. You can explore teaching on QuranScholar and continue learning with your current account."}</p>
            </header>
            {failed && <p className="mt-4" role="alert">{errorMessage}</p>}
            <div className="public-actions">
              {failed ? <button type="button" className="cw-button cw-primary" disabled={checking} onClick={onRetry}><RefreshCw size={16} aria-hidden="true" />{checking ? "Checking account…" : "Try again"}</button> : <Link to="/get-started/instructor" className="cw-button cw-primary">Explore teaching<ArrowRight size={16} aria-hidden="true" /></Link>}
              <Link to="/dashboard" className="cw-button">Back to my dashboard</Link>
            </div>
          </section>
          <aside className="public-panel" aria-labelledby="workspace-info-title">
            <h2 id="workspace-info-title">A space for your teaching</h2>
            <ul className="public-access-note">
              <li><Layers size={18} aria-hidden="true" /><div><h3>Organize your courses</h3><p>Build sections and lessons in Course Studio.</p></div></li>
              <li><ShieldCheck size={18} aria-hidden="true" /><div><h3>Manage your videos</h3><p>Upload lessons and follow their preparation progress.</p></div></li>
              <li><BookOpen size={18} aria-hidden="true" /><div><h3>Keep learning</h3><p>Exploring teaching doesn’t change your current account.</p></div></li>
            </ul>
            <div className="public-actions"><Link to="/courses" className="cw-button">Explore courses<ArrowRight size={16} aria-hidden="true" /></Link></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
