import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Settings,
  Search,
  Bell,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  CheckCircle2,
  AlertTriangle,
  Star,
} from "lucide-react";

/* =========================================================
   BERRY & SAND — light + dark tokens
   ========================================================= */

const THEMES = {
  light: {
    bg: "#FAF7F2",
    surface: "#FFFFFF",
    surfaceAlt: "#F2E8DC",
    border: "#E5D6C1",
    borderStrong: "#CBB593",
    text: "#2B211A",
    textMuted: "#6B5C4C",
    textFaint: "#998A76",
    onPrimary: "#FFFFFF",
    onAccent: "#2B1505",
    primary: "#8C3B4A",
    primaryHover: "#6E2C38",
    primaryTint: "#F3DFE2",
    secondary: "#C1707C",
    secondaryTint: "#F7E9EB",
    trackTint: "#E3C4C9",
    accent: "#D9A441",
    accentHover: "#B8862C",
    accentTint: "#FAEFD9",
    success: "#4A8F5C",
    successTint: "#E6F2E8",
    warning: "#C88A2A",
    warningTint: "#FAEDD6",
    danger: "#A83C3C",
    dangerTint: "#F4DEDE",
    shadowCard: "0 1px 2px rgba(43,33,26,0.08), 0 1px 1px rgba(43,33,26,0.05)",
    shadowRaised: "0 20px 48px rgba(43,33,26,0.22)",
  },
  dark: {
    bg: "#171310",
    surface: "#1F1915",
    surfaceAlt: "#261F19",
    border: "#332922",
    borderStrong: "#453830",
    text: "#F2E9E1",
    textMuted: "#B8A99B",
    textFaint: "#8A7A6C",
    onPrimary: "#2B1013",
    onAccent: "#2B1505",
    primary: "#D98A98",
    primaryHover: "#E3A2AE",
    primaryTint: "#3A2027",
    secondary: "#D89AA3",
    secondaryTint: "#2E1E22",
    trackTint: "#3D2C2F",
    accent: "#E8BB63",
    accentHover: "#EFC97D",
    accentTint: "#3A2D14",
    success: "#6FBE83",
    successTint: "#1D3324",
    warning: "#E0B15E",
    warningTint: "#3A2C13",
    danger: "#DE7A72",
    dangerTint: "#3A201D",
    shadowCard: "0 1px 2px rgba(0,0,0,0.35)",
    shadowRaised: "0 24px 56px rgba(0,0,0,0.55)",
  },
};

function themeVars(mode) {
  const t = THEMES[mode];
  const vars = {};
  Object.entries(t).forEach(([key, value]) => {
    vars["--" + key.replace(/([A-Z])/g, "-$1").toLowerCase()] = value;
  });
  return vars;
}

/* =========================================================
   DATA
   ========================================================= */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "courses", label: "My courses", icon: BookOpen },
  { key: "assignments", label: "Assignments", icon: ClipboardList },
  { key: "discussions", label: "Discussions", icon: MessageSquare },
  { key: "grades", label: "Grades", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

const STATS = [
  { label: "Active learners", value: "2,148", delta: "+6.2%", up: true },
  { label: "Completion rate", value: "73%", delta: "+2.1%", up: true },
  { label: "Avg. quiz score", value: "86.4", delta: "-1.4%", up: false },
  { label: "Certificates issued", value: "312", delta: "+11.8%", up: true },
];

const COURSES = [
  { title: "Applied Supply Chain Analytics", instructors: ["JH", "SK"], status: { label: "On track", tone: "success" }, tag: "Core", progress: 68, due: "Due Thu" },
  { title: "Negotiation Fundamentals", instructors: ["AL"], status: { label: "Falling behind", tone: "warning" }, tag: "Elective", progress: 31, due: "Due Tue" },
  { title: "Workplace Safety Recertification", instructors: ["RT"], status: { label: "Overdue", tone: "danger" }, tag: "Required", progress: 12, due: "Overdue" },
];

const ALL_ASSIGNMENTS = [
  { name: "Vendor risk case study", course: "Supply Chain Analytics", due: "Thu, Sep 4", status: { label: "On track", tone: "success" } },
  { name: "Negotiation roleplay reflection", course: "Negotiation Fundamentals", due: "Tue, Sep 2", status: { label: "Falling behind", tone: "warning" } },
  { name: "Safety recertification exam", course: "Workplace Safety", due: "Overdue", status: { label: "Overdue", tone: "danger" } },
  { name: "Inventory forecast worksheet", course: "Supply Chain Analytics", due: "Fri, Sep 5", status: { label: "On track", tone: "success" } },
  { name: "BATNA planning exercise", course: "Negotiation Fundamentals", due: "Mon, Sep 8", status: { label: "On track", tone: "success" } },
  { name: "PPE compliance quiz", course: "Workplace Safety", due: "Wed, Sep 10", status: { label: "On track", tone: "success" } },
  { name: "Supplier scorecard review", course: "Supply Chain Analytics", due: "Fri, Sep 12", status: { label: "On track", tone: "success" } },
];

const NOTIFICATIONS = [
  { icon: CheckCircle2, tone: "success", title: "Quiz graded — Applied Supply Chain Analytics", meta: "2 hours ago" },
  { icon: AlertTriangle, tone: "warning", title: "Negotiation Fundamentals module due tomorrow", meta: "Yesterday" },
  { icon: Star, tone: "accent", title: 'You earned the "12-day streak" badge', meta: "3 days ago" },
];

const PAGE_SIZE = 3;

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function Pill({ tone, children }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function StatCard({ stat, loading }) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton skeleton-label" />
        <div className="skeleton skeleton-value" />
        <div className="skeleton skeleton-delta" />
      </div>
    );
  }
  return (
    <div className="stat-card">
      <p className="stat-label">{stat.label}</p>
      <p className="stat-value">{stat.value}</p>
      <p className={`stat-delta ${stat.up ? "up" : "down"}`}>
        {stat.up ? "▲" : "▼"} {stat.delta} this week
      </p>
    </div>
  );
}

function CourseCard({ course, menuOpen, onToggleMenu }) {
  const progressTone = course.status.tone === "danger" ? "secondary" : course.status.tone === "warning" ? "accent" : "primary";
  return (
    <div className="course-card">
      <div className="course-banner">
        <span />
        <div className="course-menu-wrap">
          <button className="course-icon-btn" onClick={onToggleMenu}>
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="dropdown course-dropdown">
              <button className="dropdown-item">Open course</button>
              <button className="dropdown-item">Bookmark</button>
              <button className="dropdown-item dropdown-item-danger">Unenroll</button>
            </div>
          )}
        </div>
      </div>
      <div className="course-body">
        <p className="course-title">{course.title}</p>
        <div className="course-instructors">
          <div className="avatar-stack">
            {course.instructors.map((i, idx) => (
              <div className="mini-avatar" key={idx}>{i}</div>
            ))}
          </div>
          <span>{course.instructors.length} instructor{course.instructors.length > 1 ? "s" : ""}</span>
        </div>
        <div className="tag-row">
          <Pill tone={course.status.tone}>{course.status.label}</Pill>
          <Pill tone="accent">{course.tag}</Pill>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: course.progress + "%", background: `var(--${progressTone})` }} />
        </div>
        <div className="course-footer">
          <span>{course.progress}% complete</span>
          <span>{course.due}</span>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} /> Prev
      </button>
      <div className="page-numbers">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button key={n} className={`page-num ${n === page ? "active" : ""}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
      <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

function AssignmentsTable({ page, onPageChange }) {
  const totalPages = Math.ceil(ALL_ASSIGNMENTS.length / PAGE_SIZE);
  const pageItems = ALL_ASSIGNMENTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <div className="panel">
      <table>
        <thead>
          <tr><th>Assignment</th><th>Course</th><th>Due</th><th>Status</th></tr>
        </thead>
        <tbody>
          {pageItems.map((a, i) => (
            <tr key={i}>
              <td>{a.name}</td>
              <td>{a.course}</td>
              <td>{a.due}</td>
              <td><Pill tone={a.status.tone}>{a.status.label}</Pill></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination-wrap">
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      </div>
    </div>
  );
}

function NotificationBell({ open, onToggle }) {
  return (
    <div className="dropdown-wrap">
      <button className="icon-btn" onClick={onToggle}>
        <Bell size={16} />
        <span className="notif-dot" />
      </button>
      {open && (
        <div className="dropdown notif-dropdown">
          <p className="dropdown-heading">Notifications</p>
          {NOTIFICATIONS.map((n, i) => {
            const Icon = n.icon;
            return (
              <div className="dropdown-notif" key={i}>
                <div className={`toast-icon toast-${n.tone}`}><Icon size={13} /></div>
                <div>
                  <p className="toast-title">{n.title}</p>
                  <p className="toast-meta">{n.meta}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Modal({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <p className="modal-title">Report an issue</p>
          <button className="icon-btn-plain" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="modal-body">
          Let us know what went wrong with this course. Our team typically responds within one business day.
        </p>
        <textarea className="modal-textarea" placeholder="Describe the issue…" rows={4} />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger-solid" onClick={onConfirm}>Submit report</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ item }) {
  const Icon = item.icon;
  return (
    <div className="toast">
      <div className={`toast-icon toast-${item.tone}`}><Icon size={15} /></div>
      <div>
        <p className="toast-title">{item.title}</p>
        <p className="toast-meta">{item.meta}</p>
      </div>
    </div>
  );
}

function Switch({ on, onToggle }) {
  return <div className={`switch ${on ? "on" : ""}`} onClick={onToggle} />;
}

function PreferencesForm() {
  const [emailReminders, setEmailReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  return (
    <div className="form-panel">
      <div className="field">
        <label>Search courses</label>
        <input type="text" placeholder="e.g. Negotiation" />
      </div>
      <div className="switch-row" style={{ borderTop: "none" }}>
        <div><p className="switch-label">Email reminders</p><p className="switch-desc">Due-date nudges</p></div>
        <Switch on={emailReminders} onToggle={() => setEmailReminders((v) => !v)} />
      </div>
      <div className="switch-row">
        <div><p className="switch-label">Weekly digest</p><p className="switch-desc">Progress summary</p></div>
        <Switch on={weeklyDigest} onToggle={() => setWeeklyDigest((v) => !v)} />
      </div>
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

export default function BerrySandLmsDemo() {
  const [mode, setMode] = useState("light");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [openCourseMenu, setOpenCourseMenu] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  function simulateLoad() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  }

  return (
    <div className="app-shell" style={themeVars(mode)} onClick={() => { setNotifOpen(false); setOpenCourseMenu(null); }}>
      <style>{`
        .app-shell { display: flex; background: var(--bg); color: var(--text); font-family: Inter, -apple-system, sans-serif; border-radius: 18px; overflow: hidden; min-height: 640px; transition: background 0.25s ease, color 0.25s ease; }
        * { box-sizing: border-box; }

        .sidebar { width: 216px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); padding: 22px 14px; display: flex; flex-direction: column; gap: 24px; }
        .brand { font-family: Georgia, serif; font-weight: 600; font-size: 19px; padding: 0 8px; }
        .brand span { color: var(--primary); }
        .nav { display: flex; flex-direction: column; gap: 2px; }
        .nav-btn { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; color: var(--text-muted); background: none; border: none; text-align: left; font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: inherit; }
        .nav-btn.active { background: var(--primary-tint); color: var(--primary); }
        .nav-btn:not(.active):hover { background: var(--surface-alt); color: var(--text); }

        .mode-toggle { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; background: var(--surface-alt); border: 1px solid var(--border); font-size: 12.5px; color: var(--text-muted); }
        .mode-toggle-btn { border: none; background: var(--primary); color: var(--on-primary); width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .main { flex: 1; padding: 26px 32px 50px; overflow-y: auto; }
        .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 16px; }
        .breadcrumb { font-size: 12.5px; color: var(--text-faint); }
        .breadcrumb b { color: var(--text); font-weight: 600; }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .search { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); padding: 8px 12px; border-radius: 9px; font-size: 13px; color: var(--text-faint); min-width: 170px; }
        .icon-btn { position: relative; width: 36px; height: 36px; border-radius: 9px; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text); }
        .icon-btn-plain { background: none; border: none; cursor: pointer; color: var(--text-faint); display: flex; }
        .notif-dot { position: absolute; top: 7px; right: 8px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); }
        .avatar-ring { width: 36px; height: 36px; border-radius: 50%; padding: 2px; border: 2px solid var(--success); }
        .avatar { width: 100%; height: 100%; border-radius: 50%; background: var(--primary); color: var(--on-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12.5px; }

        h1 { font-family: Georgia, serif; font-weight: 600; font-size: 27px; margin: 4px 0 26px; letter-spacing: -0.01em; }

        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 30px; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 17px; box-shadow: var(--shadow-card); min-height: 92px; }
        .stat-label { font-size: 12px; color: var(--text-muted); margin: 0 0 6px; font-weight: 500; }
        .stat-value { font-family: Georgia, serif; font-size: 24px; font-weight: 600; margin: 0 0 8px; }
        .stat-delta { font-size: 11.5px; font-weight: 600; margin: 0; }
        .stat-delta.up { color: var(--success); }
        .stat-delta.down { color: var(--danger); }

        .skeleton { background: linear-gradient(90deg, var(--surface-alt) 25%, var(--border) 37%, var(--surface-alt) 63%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; border-radius: 6px; }
        .skeleton-label { width: 60%; height: 11px; margin-bottom: 10px; }
        .skeleton-value { width: 45%; height: 22px; margin-bottom: 10px; }
        .skeleton-delta { width: 70%; height: 10px; }
        @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 32px 0 14px; }
        .section-title { font-family: Georgia, serif; font-size: 17px; font-weight: 600; margin: 0; }
        .section-link { font-size: 12.5px; color: var(--primary); font-weight: 600; cursor: pointer; }
        .load-demo-btn { font-size: 12px; font-weight: 600; color: var(--primary); background: var(--primary-tint); border: none; padding: 6px 12px; border-radius: 999px; cursor: pointer; }

        .course-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .course-card { background: var(--surface); border: 1px solid var(--border); border-radius: 15px; overflow: hidden; box-shadow: var(--shadow-card); display: flex; flex-direction: column; }
        .course-banner { height: 68px; background: var(--primary-tint); display: flex; align-items: flex-start; justify-content: space-between; padding: 11px 12px; position: relative; }
        .course-card:nth-child(2) .course-banner { background: var(--accent-tint); }
        .course-card:nth-child(3) .course-banner { background: var(--secondary-tint); }
        .course-menu-wrap { position: relative; }
        .course-icon-btn { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.55); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text); }
        .course-body { padding: 13px 15px 15px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
        .course-title { font-weight: 600; font-size: 14.5px; margin: 0; }
        .course-instructors { display: flex; align-items: center; gap: 8px; }
        .avatar-stack { display: flex; }
        .avatar-stack .mini-avatar { margin-left: -8px; }
        .avatar-stack .mini-avatar:first-child { margin-left: 0; }
        .mini-avatar { width: 21px; height: 21px; border-radius: 50%; border: 2px solid var(--surface); background: var(--secondary); color: var(--on-primary); font-size: 8.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .course-instructors span { font-size: 11.5px; color: var(--text-muted); }

        .tag-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .pill { font-size: 10.5px; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
        .pill-success { background: var(--success-tint); color: var(--success); }
        .pill-warning { background: var(--warning-tint); color: var(--warning); }
        .pill-danger { background: var(--danger-tint); color: var(--danger); }
        .pill-accent { background: var(--accent-tint); color: var(--accent); }

        .progress-track { height: 6px; border-radius: 999px; background: var(--track-tint); overflow: hidden; margin-top: 2px; }
        .progress-fill { height: 100%; border-radius: 999px; transition: width 0.8s ease; }
        .course-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--text-faint); margin-top: auto; }

        .dropdown-wrap { position: relative; }
        .dropdown { position: absolute; z-index: 20; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-raised); padding: 6px; }
        .course-dropdown { top: 30px; right: 0; width: 150px; }
        .dropdown-item { display: block; width: 100%; text-align: left; background: none; border: none; padding: 8px 10px; border-radius: 7px; font-size: 12.5px; color: var(--text); cursor: pointer; font-family: inherit; }
        .dropdown-item:hover { background: var(--surface-alt); }
        .dropdown-item-danger { color: var(--danger); }
        .notif-dropdown { top: 44px; right: 0; width: 280px; padding: 10px; }
        .dropdown-heading { font-size: 12px; font-weight: 700; color: var(--text-faint); margin: 4px 6px 8px; text-transform: none; }
        .dropdown-notif { display: flex; gap: 9px; padding: 8px 6px; border-radius: 9px; }
        .dropdown-notif:hover { background: var(--surface-alt); }

        .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-card); }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th { text-align: left; padding: 11px 15px; font-size: 11px; font-weight: 700; color: var(--text-faint); background: var(--surface-alt); border-bottom: 1px solid var(--border); }
        tbody td { padding: 12px 15px; border-bottom: 1px solid var(--border); }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: var(--surface-alt); }

        .pagination-wrap { padding: 12px 15px; border-top: 1px solid var(--border); background: var(--surface); }
        .pagination { display: flex; align-items: center; justify-content: space-between; }
        .page-btn { display: flex; align-items: center; gap: 4px; background: none; border: 1px solid var(--border-strong); border-radius: 8px; padding: 6px 11px; font-size: 12px; font-weight: 600; color: var(--text); cursor: pointer; font-family: inherit; }
        .page-btn:disabled { opacity: 0.4; cursor: default; }
        .page-numbers { display: flex; gap: 4px; }
        .page-num { width: 26px; height: 26px; border-radius: 7px; border: none; background: none; font-size: 12px; font-weight: 600; color: var(--text-muted); cursor: pointer; }
        .page-num.active { background: var(--primary); color: var(--on-primary); }

        .lower-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 15px; margin-top: 32px; }
        .toast { display: flex; gap: 10px; padding: 11px 13px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); margin-bottom: 9px; box-shadow: var(--shadow-card); }
        .toast:last-child { margin-bottom: 0; }
        .toast-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .toast-success { background: var(--success-tint); color: var(--success); }
        .toast-warning { background: var(--warning-tint); color: var(--warning); }
        .toast-accent { background: var(--accent-tint); color: var(--accent); }
        .toast-title { font-size: 13px; font-weight: 600; margin: 0 0 2px; }
        .toast-meta { font-size: 11.5px; color: var(--text-faint); margin: 0; }

        .form-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; box-shadow: var(--shadow-card); }
        .field { margin-bottom: 12px; }
        .field label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
        .field input[type="text"] { width: 100%; padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg); color: var(--text); font-size: 13px; font-family: inherit; }
        .switch-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-top: 1px solid var(--border); }
        .switch-label { font-size: 13px; margin: 0; }
        .switch-desc { font-size: 11.5px; color: var(--text-faint); margin: 0; }
        .switch { width: 36px; height: 21px; border-radius: 999px; background: var(--border-strong); position: relative; cursor: pointer; flex-shrink: 0; transition: background 0.2s ease; }
        .switch.on { background: var(--primary); }
        .switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; border-radius: 50%; background: #fff; transition: left 0.2s ease; }
        .switch.on::after { left: 17px; }

        .btn-showcase { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 32px; }
        .btn { border: none; font-family: inherit; font-weight: 600; font-size: 13px; padding: 10px 17px; border-radius: 9px; cursor: pointer; }
        .btn-primary { background: var(--primary); color: var(--on-primary); }
        .btn-accent { background: var(--accent); color: var(--on-accent); }
        .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); }
        .btn-ghost { background: transparent; color: var(--primary); }
        .btn-danger { background: var(--danger-tint); color: var(--danger); }
        .btn-danger-solid { background: var(--danger); color: #fff; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(20,14,10,0.45); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
        .modal { background: var(--surface); border-radius: 16px; padding: 22px; width: 100%; max-width: 420px; box-shadow: var(--shadow-raised); border: 1px solid var(--border); }
        .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .modal-title { font-family: Georgia, serif; font-size: 16px; font-weight: 600; margin: 0; }
        .modal-body { font-size: 13px; color: var(--text-muted); margin: 0 0 14px; line-height: 1.5; }
        .modal-textarea { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1px solid var(--border-strong); background: var(--bg); color: var(--text); font-size: 13px; font-family: inherit; resize: vertical; margin-bottom: 16px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

        @media (max-width: 900px) {
          .app-shell { flex-direction: column; }
          .sidebar { width: 100%; flex-direction: row; overflow-x: auto; }
          .stats-row { grid-template-columns: repeat(2,1fr); }
          .course-grid { grid-template-columns: 1fr; }
          .lower-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="brand">Course<span>ly</span></div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`nav-btn ${activeNav === item.key ? "active" : ""}`}
                onClick={() => setActiveNav(item.key)}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mode-toggle">
          <span>{mode === "light" ? "Light mode" : "Dark mode"}</span>
          <button className="mode-toggle-btn" onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}>
            {mode === "light" ? <Moon size={13} /> : <Sun size={13} />}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <p className="breadcrumb">Courseware / <b>Dashboard</b></p>
          <div className="topbar-right">
            <div className="search"><Search size={13} /> Search courses…</div>
            <NotificationBell open={notifOpen} onToggle={(e) => { e.stopPropagation(); setNotifOpen((v) => !v); }} />
            <div className="avatar-ring"><div className="avatar">MR</div></div>
          </div>
        </div>
        <h1>Welcome back, Rizwan</h1>

        <div className="section-head" style={{ marginTop: 0 }}>
          <p className="section-title">Overview</p>
          <button className="load-demo-btn" onClick={simulateLoad}>Simulate loading state</button>
        </div>
        <div className="stats-row">
          {STATS.map((s, i) => (
            <StatCard stat={s} key={i} loading={loading} />
          ))}
        </div>

        <div className="section-head">
          <p className="section-title">Your courses</p>
          <span className="section-link">View all</span>
        </div>
        <div className="course-grid">
          {COURSES.map((c, i) => (
            <CourseCard
              course={c}
              key={i}
              menuOpen={openCourseMenu === i}
              onToggleMenu={(e) => { e.stopPropagation(); setOpenCourseMenu(openCourseMenu === i ? null : i); }}
            />
          ))}
        </div>

        <div className="section-head">
          <p className="section-title">Assignments</p>
        </div>
        <AssignmentsTable page={page} onPageChange={setPage} />

        <div className="lower-grid">
          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <p className="section-title">Notifications</p>
            </div>
            {NOTIFICATIONS.map((n, i) => (
              <Toast item={n} key={i} />
            ))}
          </div>
          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <p className="section-title">Preferences</p>
            </div>
            <PreferencesForm />
          </div>
        </div>

        <div className="section-head">
          <p className="section-title">Components</p>
        </div>
        <div className="btn-showcase">
          <button className="btn btn-primary">Resume course</button>
          <button className="btn btn-accent">Claim badge</button>
          <button className="btn btn-secondary">View schedule</button>
          <button className="btn btn-ghost">Dismiss</button>
          <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}>
            Report an issue
          </button>
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} onConfirm={() => setModalOpen(false)} />
    </div>
  );
}
