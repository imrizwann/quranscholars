import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Camera, ArrowLeft, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useUploadAvatarMutation } from "@/services/api/user/fileUploadApis.js";
import useProfilePhoto from "@/features/profile/useProfilePhoto.js";
import AvatarImage from "@/features/profile/components/AvatarImage.jsx";
import { getProfileInitials } from "@/features/profile/profile-initials.js";
import ProfileDeleteModal from "@/features/profile/components/ProfileDeleteModal.jsx";
import LearnerProfileForm from "@/features/profile/components/LearnerProfileForm.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";
import "./profile.css";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const role = ({ admin: "Administrator", instructor: "Instructor", user: "Learner", student: "Learner" })[user?.role] || "Member";
  const dashboard = user?.role === "admin" ? "/admin/instructor-applications" : user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard";

  useEffect(() => {
    if (!file) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseImage(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setMessage("");
    if (!ALLOWED_TYPES.includes(selected.type)) { setError("Choose a JPG, PNG, or WebP image."); return; }
    if (!selected.size || selected.size > 3 * 1024 * 1024) { setError("Choose a non-empty image no larger than 3 MB."); return; }
    setFile(selected);
    setError("");
  }

  async function savePhoto() {
    if (!file || uploading.current) return;
    uploading.current = true;
    setError(""); setMessage("");
    const body = new FormData(); body.append("file", file);
    try {
      await uploadAvatar(body).unwrap();
      setFile(null);
      setMessage("Your profile photo has been updated.");
    } catch (failure) { setError(userMessage(failure, "We could not update your profile photo. Please try again.")); }
    finally { uploading.current = false; }
  }

  return <main className="public-page profile-page">
    <ProfileDeleteModal returnFocus={deleteButton} open={modalVisible} onClose={() => setModalVisible(false)} />
    <Link className="public-back" to={dashboard}><ArrowLeft size={16} aria-hidden="true" />Back to dashboard</Link>
    <header className="public-heading"><p className="public-eyebrow">Your account</p><h1>Your profile</h1><p>Manage your profile photo, review your account details, and control your account access.</p></header>
    <div className="profile-layout">
      <div className="profile-main">
        <section className="public-panel profile-photo-panel" aria-labelledby="profile-photo-title">
          <div className="profile-photo" aria-busy={isUploading || undefined}>
            <AvatarImage src={previewUrl || photo.data?.url} alt={`${name}'s profile photo`} size={112} className="profile-avatar-image" fallback={<span aria-hidden="true">{initials}</span>} />
          </div>
          <div className="profile-photo-content">
            <h2 id="profile-photo-title">Profile photo</h2>
            <p>Choose a photo for your account. JPG, PNG, or WebP, up to 3 MB.</p>
            {user?.role === "instructor" && <p className="profile-account-help">Your account name and photo also appear on your public instructor profile and course pages.</p>}
            <input id="profile-photo-upload" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={chooseImage} aria-label="Choose a profile photo" disabled={isUploading} />
            <div className="profile-actions">
              <button type="button" className="cw-button" onClick={() => fileInput.current?.click()} disabled={isUploading}><Camera size={16} aria-hidden="true" />{photo.data?.url ? "Change photo" : "Choose photo"}</button>
              {file && <><AsyncButton className="cw-button cw-primary" loading={isUploading} loadingLabel="Saving photo" onClick={savePhoto}><Upload size={16} aria-hidden="true" />Save photo</AsyncButton><button type="button" className="cw-button" disabled={isUploading} onClick={() => { setFile(null); setError(""); }}>Cancel</button></>}
            </div>
            {file && <p className="profile-file">Selected: {file.name}</p>}
            {error && <p className="profile-feedback profile-feedback-error" role="alert">{error}</p>}
            {message && <p className="profile-feedback" role="status">{message}</p>}
            {photo.isError && <div className="profile-photo-error"><p>Your saved photo could not be loaded.</p><AsyncButton className="cw-button cw-button-compact" loading={photo.isFetching} loadingLabel="Loading" onClick={photo.refetch}>Try again</AsyncButton></div>}
          </div>
        </section>
        <section className="public-panel" aria-labelledby="profile-details-title">
          <h2 id="profile-details-title">Account details</h2>
          <p className="profile-section-description">Your registered account information.</p>
          <dl className="profile-details"><div><dt>Full name</dt><dd>{name}</dd></div><div><dt>Email address</dt><dd>{user?.email || "Not provided"}</dd></div><div><dt>Account type</dt><dd>{role}</dd></div></dl>
          <p className="profile-account-help">Need to correct your name or email? <Link to="/contact">Contact our team</Link>.</p>
        </section>
        {user?._id && <LearnerProfileForm key={user._id} />}
      </div>
      <aside className="profile-sidebar">
        <section className="public-panel" aria-labelledby="profile-access-title"><span className="public-icon"><ShieldCheck size={20} aria-hidden="true" /></span><h2 id="profile-access-title" className="profile-card-title">Account access</h2><p>Use your registered email and password to sign in. Keep your password private.</p><div className="profile-actions"><Link to={dashboard} className="cw-button">Open dashboard</Link></div></section>
        <section className="public-panel profile-danger" aria-labelledby="profile-delete-title"><Trash2 size={20} aria-hidden="true" /><h2 id="profile-delete-title" className="profile-card-title">Delete account</h2><p>Deleting your account permanently ends your access. You will need your current password to confirm.</p><div className="profile-actions"><button ref={deleteButton} type="button" className="cw-button cw-danger" disabled={isUploading} onClick={() => setModalVisible(true)}>Delete account</button></div></section>
      </aside>
    </div>
  </main>;
}
