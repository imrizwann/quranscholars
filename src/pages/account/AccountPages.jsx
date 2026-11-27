import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, BadgeCheck, BookOpen, Camera, CheckCheck, CircleCheck, KeyRound, LogOut, Mail, MailWarning, Trash2, Upload, UserRound } from "lucide-react";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import AvatarImage from "@/features/profile/components/AvatarImage.jsx";
import LearnerProfileForm from "@/features/profile/components/LearnerProfileForm.jsx";
import ProfileDeleteModal from "@/features/profile/components/ProfileDeleteModal.jsx";
import TeachingCard from "@/features/profile/components/TeachingCard.jsx";
import useAvatarUpload from "@/features/profile/useAvatarUpload.js";
import useProfilePhoto from "@/features/profile/useProfilePhoto.js";
import { getProfileInitials } from "@/features/profile/profile-initials.js";
import useSignOut from "@/features/auth/useSignOut.js";
import learnerApi from "@/services/api/user/learnerApi.js";
import userAuthApi, { useForgotPasswordMutation, useRequestEmailVerificationMutation } from "@/services/api/user/userAuthApis.js";
import { userMessage } from "@/lib/user-messages.js";
import { profilePath, settingsPath } from "@/features/profile/account-paths.js";
import "./profile.css";
import "./account.css";

const isLearner = role => !["instructor", "admin"].includes(role);
const roleLabel = role => ({ admin: "Administrator", instructor: "Instructor", user: "Learner", student: "Learner" })[role] || "Member";

/* ---------- Profile (/dashboard, /instructor or /admin + /profile) ---------- */

function IdentityCard({ user }) {
  const photo = useProfilePhoto();
  const upload = useAvatarUpload();
  const name = user?.name?.trim() || "Your account";
  return <section className="studio-panel account-identity" aria-labelledby="account-name" aria-busy={upload.isUploading || undefined}>
    <div className="account-identity-head">
      <div className="profile-photo account-photo">
        <AvatarImage src={upload.previewUrl || photo.data?.url} alt={`${name}'s profile photo`} size={88} className="profile-avatar-image" fallback={<span aria-hidden="true">{getProfileInitials(user?.name)}</span>} />
        <button type="button" className="profile-photo-edit" onClick={upload.openPicker} disabled={upload.isUploading} aria-label={photo.data?.url ? "Change profile photo" : "Choose a profile photo"}>
          <Camera size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="account-identity-copy">
        <h2 id="account-name">{name}</h2>
        <p>{user?.email || "Email not provided"}</p>
        <div className="profile-badges">
          <span className="profile-badge" data-tone="role">{roleLabel(user?.role)}</span>
          {user?.emailVerified
            ? <span className="profile-badge" data-tone="approved"><BadgeCheck size={14} aria-hidden="true" />Email verified</span>
            : <Link to={settingsPath(user?.role)} className="profile-badge" data-tone="pending"><MailWarning size={14} aria-hidden="true" />Verify your email</Link>}
        </div>
      </div>
    </div>
    {/* The camera button on the photo opens this picker; Save and Cancel appear once an image is chosen. */}
    <input ref={upload.fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload.chooseImage} aria-label="Choose a profile photo" disabled={upload.isUploading} />
    <div className="account-photo-controls" data-pending={upload.file ? "" : undefined}>
      <p>{upload.file
        ? `Previewing ${upload.file.name}. Save it to update your photo everywhere on DarsLearn.`
        : "To change your photo, use the camera button. JPG, PNG or WebP, up to 3 MB."}
        {!upload.file && user?.role === "instructor" && " Your name and photo also appear on your public instructor profile and course pages."}</p>
      {upload.file && <div className="profile-actions">
        <AsyncButton className="cw-button cw-primary" loading={upload.isUploading} loadingLabel="Saving photo" onClick={upload.savePhoto}><Upload size={16} aria-hidden="true" />Save photo</AsyncButton>
        <button type="button" className="cw-button" disabled={upload.isUploading} onClick={upload.cancel}>Cancel</button>
      </div>}
    </div>
    {upload.error && <p className="profile-feedback profile-feedback-error" role="alert">{upload.error}</p>}
    {upload.message && <p className="profile-feedback" role="status">{upload.message}</p>}
    {photo.isError && <p className="profile-feedback profile-feedback-error" role="alert">Your saved photo could not be loaded. <button type="button" className="cw-text-link" onClick={photo.refetch}>Try again</button></p>}
  </section>;
}

function LearningSnapshot() {
  const query = learnerApi.endpoints.getLearnerAnalytics.useQuery(undefined, { refetchOnMountOrArgChange: true });
  const summary = query.isError ? null : query.currentData?.summary;
  const items = [
    { icon: BookOpen, label: "Enrolled courses", value: summary?.totalEnrolledCourses },
    { icon: CheckCheck, label: "Lessons completed", value: summary?.completedLessons },
    { icon: CircleCheck, label: "Courses completed", value: summary?.completedCourses },
  ];
  return <section className="studio-panel account-snapshot" aria-labelledby="account-snapshot-title">
    <h2 id="account-snapshot-title">Your learning</h2>
    {query.isError ? <p className="account-muted">Your learning summary is unavailable right now.</p> : <dl>
      {items.map(({ icon: Icon, label, value }) => <div key={label}>
        <dt><Icon size={16} aria-hidden="true" />{label}</dt>
        <dd>{value == null ? <span className="account-skeleton" role="status"><span className="sr-only">Loading</span></span> : Number(value).toLocaleString()}</dd>
      </div>)}
    </dl>}
    <Link to="/dashboard/progress" className="account-link">View your progress<ArrowRight size={15} aria-hidden="true" /></Link>
  </section>;
}

export function AccountProfilePage() {
  const user = useSelector(state => state.user.user);
  return <WorkspacePage eyebrow="Account" title="Your profile" description="How you appear on DarsLearn, plus optional details that help us suggest the right courses.">
    <div className="account-page account-layout">
      <div className="account-main">
        <IdentityCard user={user} />
        {user?._id && <LearnerProfileForm key={user._id} />}
      </div>
      <aside className="account-side" aria-label="Learning and teaching summary">
        {isLearner(user?.role) && <LearningSnapshot />}
        <TeachingCard user={user} />
      </aside>
    </div>
  </WorkspacePage>;
}

/* ---------- Settings ---------- */

function SettingRow({ icon: Icon, title, description, children }) {
  return <div className="setting-row">
    <div className="setting-label">
      <span className="setting-icon"><Icon size={18} aria-hidden="true" /></span>
      <div><h3>{title}</h3>{description && <p>{description}</p>}</div>
    </div>
    <div className="setting-control">{children}</div>
  </div>;
}

function EmailSetting({ user }) {
  const dispatch = useDispatch();
  const [resend, sending] = useRequestEmailVerificationMutation();
  const [cooldown, setCooldown] = useState(0);
  const [note, setNote] = useState({ text: "", error: false });
  const pending = useRef(false);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function send() {
    if (pending.current || cooldown) return;
    pending.current = true;
    setNote({ text: "", error: false });
    try {
      const result = await resend().unwrap();
      setNote({ text: result?.message || `We sent a verification link to ${user.email}.`, error: false });
      setCooldown(60);
      dispatch(userAuthApi.endpoints.me.initiate(undefined, { subscribe: false, forceRefetch: true }));
    } catch (failure) {
      setNote({ text: userMessage(failure), error: true });
    } finally {
      pending.current = false;
    }
  }
  return <SettingRow icon={Mail} title="Email address" description="Used to sign in and to receive receipts and course updates.">
    <p className="setting-value">{user?.email || "Not provided"}</p>
    {user?.emailVerified
      ? <span className="profile-badge" data-tone="approved"><BadgeCheck size={14} aria-hidden="true" />Verified</span>
      : <>
        <span className="profile-badge" data-tone="pending"><MailWarning size={14} aria-hidden="true" />Not verified yet</span>
        <AsyncButton className="cw-button" loading={sending.isLoading} loadingLabel="Sending" disabled={cooldown > 0} onClick={send}>{cooldown ? `Send again in ${cooldown}s` : "Send verification email"}</AsyncButton>
      </>}
    {note.text && <p className={`setting-note${note.error ? " is-error" : ""}`} role={note.error ? "alert" : "status"}>{note.text}</p>}
  </SettingRow>;
}

function PasswordSetting({ email }) {
  const [request, sending] = useForgotPasswordMutation();
  const [note, setNote] = useState({ text: "", error: false });
  const pending = useRef(false);
  async function send() {
    if (pending.current || !email) return;
    pending.current = true;
    setNote({ text: "", error: false });
    try {
      await request(email.trim().toLowerCase()).unwrap();
      setNote({ text: `We sent a reset link to ${email}. It expires in 30 minutes and works once. Check your spam folder too.`, error: false });
    } catch (failure) {
      setNote({ text: userMessage(failure), error: true });
    } finally {
      pending.current = false;
    }
  }
  return <SettingRow icon={KeyRound} title="Password" description="We email you a secure link to choose a new password.">
    <AsyncButton className="cw-button" loading={sending.isLoading} loadingLabel="Sending link" disabled={!email} onClick={send}>Send password reset link</AsyncButton>
    {note.text && <p className={`setting-note${note.error ? " is-error" : ""}`} role={note.error ? "alert" : "status"}>{note.text}</p>}
  </SettingRow>;
}

export function AccountSettingsPage() {
  const user = useSelector(state => state.user.user);
  const { signOut, isSigningOut } = useSignOut();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteButton = useRef(null);
  return <WorkspacePage eyebrow="Account" title="Settings" description="Manage how you sign in and keep your account secure.">
    <ProfileDeleteModal returnFocus={deleteButton} open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    <div className="account-page account-settings">
      <section className="studio-panel settings-group" aria-labelledby="settings-account-title">
        <h2 id="settings-account-title">Account</h2>
        <SettingRow icon={UserRound} title="Name" description="Shown on your profile. Reviews you post show your first name and last initial.">
          <p className="setting-value">{user?.name || "Not provided"}</p>
          <p className="setting-note">To correct your name or email, <Link to="/contact">contact our team</Link>.</p>
        </SettingRow>
        <EmailSetting user={user} />
        <SettingRow icon={BookOpen} title="Learning profile" description="Your photo and optional details such as country and preferred language.">
          <Link to={profilePath(user?.role)} className="cw-button">Edit profile<ArrowRight size={16} aria-hidden="true" /></Link>
        </SettingRow>
      </section>

      <section className="studio-panel settings-group" aria-labelledby="settings-security-title">
        <h2 id="settings-security-title">Sign-in and security</h2>
        <PasswordSetting email={user?.email} />
        <SettingRow icon={LogOut} title="Sign out" description="Sign out of DarsLearn on this device. Your progress stays saved.">
          <AsyncButton className="cw-button" loading={isSigningOut} loadingLabel="Signing out" onClick={signOut}><LogOut size={16} aria-hidden="true" />Sign out</AsyncButton>
        </SettingRow>
      </section>

      <section className="studio-panel settings-group settings-danger" aria-labelledby="settings-danger-title">
        <h2 id="settings-danger-title">Delete account</h2>
        <SettingRow icon={Trash2} title="Delete your account" description={user?.role === "instructor"
          ? "Permanently ends your access. Courses, including archived ones, need an instructor, so resolve course ownership with our team first. You will need your current password to confirm."
          : "Permanently ends your access to your courses and learning history. You will need your current password to confirm."}>
          <button ref={deleteButton} type="button" className="cw-button cw-danger" onClick={() => setDeleteOpen(true)}>Delete account</button>
        </SettingRow>
      </section>
    </div>
  </WorkspacePage>;
}
