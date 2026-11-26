import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, BadgeCheck, Camera, ChevronRight, KeyRound, MailWarning, Presentation, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useUploadAvatarMutation } from "@/services/api/user/fileUploadApis.js";
import { useGetMyInstructorApplicationQuery } from "@/services/api/user/instructorApplicationApi.js";
import useProfilePhoto from "@/features/profile/useProfilePhoto.js";
import AvatarImage from "@/features/profile/components/AvatarImage.jsx";
import { getProfileInitials } from "@/features/profile/profile-initials.js";
import ProfileDeleteModal from "@/features/profile/components/ProfileDeleteModal.jsx";
import LearnerProfileForm from "@/features/profile/components/LearnerProfileForm.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import FileTypeIcon from "@/components/files/FileTypeIcon.jsx";
import { userMessage } from "@/lib/user-messages.js";
import "../onboarding/onboarding.css";
import "./profile.css";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Teaching card: the right next step for each account type and application status.
function TeachingCard({ user }) {
  const learner = user?.role === "user";
  const query = useGetMyInstructorApplicationQuery(undefined, { skip: !learner, refetchOnMountOrArgChange: true });
  const application = query.currentData?.application;

  let card = {
    badge: null,
    title: "Teach on DarsLearn",
    text: "Share your knowledge with learners everywhere. Apply with your teaching background and certificates, and our team will review your application.",
    primary: { to: "/instructor/application", label: "Apply to teach" },
    secondary: { to: "/get-started/instructor", label: "How teaching works" },
  };
  if (user?.role === "admin") card = {
    title: "Instructor applications",
    text: "Review teaching backgrounds and certificates before approving instructor access.",
    primary: { to: "/admin/instructor-applications", label: "Review applications" },
  };
  else if (user?.role === "instructor") card = {
    badge: { tone: "approved", label: "Instructor" },
    title: "Your teaching workspace",
    text: "Create courses, organise your lessons and follow how your learners are progressing.",
    primary: { to: "/instructor/courses", label: "Open Course Studio" },
    secondary: { to: "/instructor/dashboard", label: "Instructor dashboard" },
  };
  else if (application?.status === "pending") card = {
    badge: { tone: "pending", label: "Under review" },
    title: "Your teaching application",
    text: "Our team is reviewing your background and certificates. You can keep learning while you wait.",
    primary: { to: "/instructor/application", label: "View application" },
  };
  else if (application?.status === "rejected") card = {
    badge: { tone: "rejected", label: "Changes requested" },
    title: "Your teaching application",
    text: "Read the team's feedback, update your details or certificates and submit your application again.",
    primary: { to: "/instructor/application", label: "Revise application" },
  };
  else if (application?.status === "approved") card = {
    badge: { tone: "approved", label: "Approved" },
    title: "Your teaching application",
    text: "Your application has been approved. Open your application to see the next steps.",
    primary: { to: "/instructor/application", label: "View application" },
  };

  return (
    <section className="public-panel profile-teach" aria-labelledby="profile-teach-title" aria-busy={(learner && query.isLoading) || undefined}>
      <div className="profile-teach-head">
        <span className="profile-teach-icon"><Presentation size={20} aria-hidden="true" /></span>
        {card.badge && <span className="profile-badge" data-tone={card.badge.tone}>{card.badge.label}</span>}
      </div>
      <h2 id="profile-teach-title" className="profile-card-title">{card.title}</h2>
      <p>{learner && query.isLoading ? "Checking your teaching application…" : card.text}</p>
      <div className="profile-actions">
        <Link to={card.primary.to} className="cw-button cw-primary">{card.primary.label}<ArrowRight size={16} aria-hidden="true" /></Link>
        {card.secondary && <Link to={card.secondary.to} className="profile-text-link">{card.secondary.label}</Link>}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const [modalVisible, setModalVisible] = useState(false);
  const photo = useProfilePhoto();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const user = useSelector((state) => state.user.user);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef(null);
  const deleteButton = useRef(null);
  const uploading = useRef(false);
  const name = user?.name?.trim() || "Your account";
  const initials = getProfileInitials(user?.name);
  const role =
    {
      admin: "Administrator",
      instructor: "Instructor",
      user: "Learner",
      student: "Learner",
    }[user?.role] || "Member";
  const dashboard =
    user?.role === "admin"
      ? "/admin/instructor-applications"
      : user?.role === "instructor"
        ? "/instructor/dashboard"
        : "/dashboard";

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseImage(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setMessage("");
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (!selected.size || selected.size > 3 * 1024 * 1024) {
      setError("Choose a non-empty image no larger than 3 MB.");
      return;
    }
    setFile(selected);
    setError("");
  }

  async function savePhoto() {
    if (!file || uploading.current) return;
    uploading.current = true;
    setError("");
    setMessage("");
    const body = new FormData();
    body.append("file", file);
    try {
      await uploadAvatar(body).unwrap();
      setFile(null);
      setMessage("Your profile photo has been updated.");
    } catch (failure) {
      setError(
        userMessage(
          failure,
          "We could not update your profile photo. Please try again.",
        ),
      );
    } finally {
      uploading.current = false;
    }
  }

  return (
    <main className="start-page profile-page">
      <ProfileDeleteModal
        returnFocus={deleteButton}
        open={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      {/* Identity header */}
      <section className="start-hero profile-hero" aria-labelledby="profile-name">
        <span className="start-hero-pattern" aria-hidden="true" />
        <div className="start-shell">
          <nav className="start-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="start-breadcrumb-item"><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Profile</span></span>
          </nav>
          <div className="profile-identity">
            <div className="profile-photo" aria-busy={isUploading || undefined}>
              <AvatarImage
                src={previewUrl || photo.data?.url}
                alt={`${name}'s profile photo`}
                size={104}
                className="profile-avatar-image"
                fallback={<span aria-hidden="true">{initials}</span>}
              />
              <button
                type="button"
                className="profile-photo-edit"
                onClick={() => fileInput.current?.click()}
                disabled={isUploading}
                aria-label={photo.data?.url ? "Change profile photo" : "Choose a profile photo"}
              >
                <Camera size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="profile-identity-copy">
              <h1 id="profile-name">{name}</h1>
              <p className="profile-identity-email">{user?.email || "Email not provided"}</p>
              <div className="profile-badges">
                <span className="profile-badge" data-tone="role">{role}</span>
                {user?.emailVerified
                  ? <span className="profile-badge" data-tone="approved"><BadgeCheck size={14} aria-hidden="true" />Email verified</span>
                  : <Link to="/verify-email" className="profile-badge" data-tone="pending"><MailWarning size={14} aria-hidden="true" />Verify your email</Link>}
              </div>
            </div>
            <div className="profile-identity-actions">
              <Link to="/dashboard/learning" className="cw-button cw-primary">My learning<ArrowRight size={16} aria-hidden="true" /></Link>
              <Link to={dashboard} className="cw-button">Open dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="start-shell profile-body">
        <div className="profile-layout">
          <div className="profile-main">
            <section className="public-panel" aria-labelledby="profile-details-title">
              <h2 id="profile-details-title">Account details</h2>
              <p className="profile-section-description">Your registered account information.</p>
              <dl className="profile-details">
                <div><dt>Full name</dt><dd>{name}</dd></div>
                <div><dt>Email address</dt><dd>{user?.email || "Not provided"}</dd></div>
                <div><dt>Account type</dt><dd>{role}</dd></div>
                <div><dt>Email status</dt><dd>{user?.emailVerified ? "Verified" : "Not yet verified"}</dd></div>
              </dl>
              <p className="profile-account-help">
                Need to correct your name or email? <Link to="/contact">Contact our team</Link>.
              </p>
              {!user?.emailVerified && (
                <div className="profile-actions">
                  <Link className="cw-button" to="/verify-email">Verify email</Link>
                </div>
              )}
            </section>

            <section className="public-panel profile-photo-panel" aria-labelledby="profile-photo-title">
              <div className="profile-photo-content">
                <h2 id="profile-photo-title">Profile photo</h2>
                <p>Choose a photo for your account. JPG, PNG, or WebP, up to 3 MB.</p>
                {user?.role === "instructor" && (
                  <p className="profile-account-help">
                    Your account name and photo also appear on your public instructor profile and course pages.
                  </p>
                )}
                <input
                  id="profile-photo-upload"
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={chooseImage}
                  aria-label="Choose a profile photo"
                  disabled={isUploading}
                />
                <div className="profile-actions">
                  <button type="button" className="cw-button" onClick={() => fileInput.current?.click()} disabled={isUploading}>
                    <Camera size={16} aria-hidden="true" />
                    {photo.data?.url ? "Change photo" : "Choose photo"}
                  </button>
                  {file && (
                    <>
                      <AsyncButton className="cw-button cw-primary" loading={isUploading} loadingLabel="Saving photo" onClick={savePhoto}>
                        <Upload size={16} aria-hidden="true" />
                        Save photo
                      </AsyncButton>
                      <button type="button" className="cw-button" disabled={isUploading} onClick={() => { setFile(null); setError(""); }}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
                {file && (
                  <div className="profile-selected-file qs-file-surface" data-file-kind="image">
                    <FileTypeIcon kind="image" size="sm" />
                    <p className="profile-file">Selected image: {file.name}. The preview is shown at the top of the page.</p>
                  </div>
                )}
                {error && <p className="profile-feedback profile-feedback-error" role="alert">{error}</p>}
                {message && <p className="profile-feedback" role="status">{message}</p>}
                {photo.isError && (
                  <div className="profile-photo-error">
                    <p>Your saved photo could not be loaded.</p>
                    <AsyncButton className="cw-button cw-button-compact" loading={photo.isFetching} loadingLabel="Loading" onClick={photo.refetch}>
                      Try again
                    </AsyncButton>
                  </div>
                )}
              </div>
            </section>

            {user?._id && <LearnerProfileForm key={user._id} />}
          </div>

          <aside className="profile-sidebar">
            <TeachingCard user={user} />

            <section className="public-panel" aria-labelledby="profile-access-title">
              <span className="public-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
              <h2 id="profile-access-title" className="profile-card-title">Account access</h2>
              <p>Use your registered email and password to sign in. Keep your password private.</p>
              <div className="profile-actions">
                <Link to="/forgot-password" className="cw-button"><KeyRound size={16} aria-hidden="true" />Reset password</Link>
              </div>
            </section>

            <section className="public-panel profile-danger" aria-labelledby="profile-delete-title">
              <Trash2 size={20} aria-hidden="true" />
              <h2 id="profile-delete-title" className="profile-card-title">Delete account</h2>
              <p>Deleting your account permanently ends your access. You will need your current password to confirm.</p>
              {user?.role === "instructor" && (
                <p className="profile-account-help">
                  Courses, including archived courses, need an instructor. Resolve course ownership with our team before deleting your account.
                </p>
              )}
              <div className="profile-actions">
                <button ref={deleteButton} type="button" className="cw-button cw-danger" disabled={isUploading} onClick={() => setModalVisible(true)}>
                  Delete account
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
