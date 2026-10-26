import { userMessage } from "@/lib/user-messages.js";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { useSelector } from "react-redux";
import {
  useUploadAvatarMutation,
  useGetAvatarUrlQuery,
} from "@/services/api/user/fileUploadApis.js";
import ProfileDeleteModal from "@/features/profile/components/ProfileDeleteModal.jsx";
import {
  Camera,
  CheckCircle2,
  Edit3,
  Globe2,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-[#d8e2dd] bg-white px-3.5 text-sm font-semibold text-[#1f392f] outline-none transition disabled:cursor-not-allowed disabled:bg-[#f4f7f5] disabled:text-[#728078] focus:border-primary focus:ring-4 focus:ring-[#0f766e]/10";

const ProfilePage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { data } = useGetAvatarUrlQuery();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const { user } = useSelector((state) => state.user);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "Committed to consistent Quran study and deeper understanding.",
    location: "",
    phone: "",
  });

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    setUserDetails((current) => ({
      ...current,
      name: user?.name || current.name,
      email: user?.email || current.email,
    }));
  }, [user]);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setMessage(null);
  };

  const handleImageUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadAvatar(formData).unwrap();
      setMessage("Avatar updated.");
      setFile(null);
      setError(null);
    } catch (requestError) {
      setError(userMessage(requestError, "We could not update your profile photo. Please try again."));
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setUserDetails((current) => ({ ...current, [name]: value }));
  };

  const handleSaveProfile = () => {
    setMessage("Profile preferences updated for this session.");
    setEditMode(false);
  };

  const initials = (userDetails.name || userDetails.email || "QS")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="bg-[#f5f8f6] px-4 py-10 text-[#172b24] sm:px-6 sm:py-14">
      <Toaster position="top-center" visibleToasts={3} toastOptions={{ duration: 4500 }} />
      <AnimatePresence>{modalVisible && <ProfileDeleteModal onClose={() => setModalVisible(false)} />}</AnimatePresence>

      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-primary">Account profile</p><h1 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] sm:text-4xl">Your personal workspace</h1><p className="mt-3 text-sm font-medium leading-6 text-[#687970]">Manage your identity, contact information, and account preferences.</p></div>
          <div className="flex flex-wrap gap-2"><span className="rounded-full border border-[#d7e2dc] bg-white px-3 py-1.5 text-xs font-black capitalize text-[#51665c]">{user?.role || "student"}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-[#e2f1eb] px-3 py-1.5 text-xs font-black text-[#176255]"><CheckCircle2 className="size-3.5" />Account active</span></div>
        </header>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white shadow-[0_15px_45px_rgba(21,54,44,.06)]" aria-labelledby="profile-summary-title">
          <div className="h-24 bg-[#0b3e38] [background-image:radial-gradient(circle_at_85%_20%,rgba(116,201,178,.35),transparent_25%),radial-gradient(circle_at_10%_100%,rgba(244,201,93,.15),transparent_30%)]" />
          <div className="grid gap-6 px-6 pb-7 sm:grid-cols-[8rem_1fr] sm:px-8">
            <div className="-mt-12">
              <div className="relative grid size-28 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-[#dcece6] text-2xl font-black text-primary shadow-lg">
                {previewUrl || data?.url ? <img src={previewUrl || data?.url} alt="Profile" className="size-full object-cover" /> : initials}
                <label className="absolute bottom-1.5 right-1.5 grid size-9 cursor-pointer place-items-center rounded-lg bg-[#0f766e] text-white shadow-md transition hover:bg-[#0b665f]" aria-label="Choose avatar"><Camera className="size-4" /><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageChange} /></label>
              </div>
            </div>
            <div className="pt-1 sm:pt-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 id="profile-summary-title" className="text-2xl font-black tracking-[-0.03em]">{userDetails.name || "QuranScholar student"}</h2><p className="mt-1 text-sm font-semibold text-[#718078]">{userDetails.email}</p></div>{file && <div className="flex gap-2"><button type="button" onClick={handleImageUpload} disabled={isUploading} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0f766e] px-3.5 text-xs font-black text-white disabled:opacity-60">{isUploading && <Loader2 className="size-3.5 animate-spin" />}Save photo</button><button type="button" onClick={() => setFile(null)} className="min-h-10 rounded-lg border border-[#d8e2dd] px-3.5 text-xs font-black text-[#52655c]">Cancel</button></div>}</div>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-[#5f7268]">{userDetails.bio}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#718078]"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-primary" />{userDetails.location || "Location not added"}</span><span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-primary" />{userDetails.phone || "Phone not added"}</span><span className="inline-flex items-center gap-1.5"><Globe2 className="size-3.5 text-primary" />Timezone detected automatically</span></div>
              {(error || message) && <p className={`mt-4 rounded-lg px-3 py-2 text-xs font-bold ${error ? "bg-red-50 text-red-700" : "bg-[#e7f4ef] text-[#176255]"}`} role="status">{error || message}</p>}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,.55fr)] lg:items-start">
          <section className="rounded-2xl border border-[#dfe6e2] bg-white p-6 sm:p-8" aria-labelledby="profile-details-title">
            <div className="flex items-start justify-between gap-4"><div><h2 id="profile-details-title" className="text-xl font-black tracking-[-0.025em]">Profile details</h2><p className="mt-1 text-sm font-medium text-[#718078]">Review how your account is identified.</p></div>{!editMode && <button type="button" onClick={() => setEditMode(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d8e2dd] px-3.5 text-xs font-black text-[#365147]"><Edit3 className="size-3.5" />Edit</button>}</div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-black text-[#29443a]">Full name<input className={inputClass} name="name" value={userDetails.name} onChange={handleFieldChange} disabled={!editMode} /></label>
              <label className="text-sm font-black text-[#29443a]">Email address<input className={inputClass} name="email" type="email" value={userDetails.email} disabled /></label>
              <label className="text-sm font-black text-[#29443a]">Phone number<input className={inputClass} name="phone" placeholder="Add phone" value={userDetails.phone} onChange={handleFieldChange} disabled={!editMode} /></label>
              <label className="text-sm font-black text-[#29443a]">Location<input className={inputClass} name="location" placeholder="City, country" value={userDetails.location} onChange={handleFieldChange} disabled={!editMode} /></label>
              <label className="text-sm font-black text-[#29443a] sm:col-span-2">Short bio<textarea className={`${inputClass} min-h-28 resize-y py-3`} name="bio" value={userDetails.bio} onChange={handleFieldChange} disabled={!editMode} /></label>
            </div>
            {editMode && <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#e5ebe8] pt-5"><button type="button" onClick={() => setEditMode(false)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d8e2dd] px-4 text-xs font-black text-[#52655c]"><X className="size-3.5" />Cancel</button><button type="button" onClick={handleSaveProfile} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0f766e] px-4 text-xs font-black text-white"><CheckCircle2 className="size-3.5" />Save changes</button></div>}
          </section>

          <div className="grid gap-6">
            <section className="rounded-2xl border border-[#dfe6e2] bg-white p-6" aria-labelledby="security-title"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e6f2ed] text-primary"><ShieldCheck className="size-4.5" /></span><div><h2 id="security-title" className="font-black">Security & access</h2><p className="text-xs font-medium text-[#718078]">Account safeguards</p></div></div><div className="mt-5 grid gap-3"><div className="rounded-xl bg-[#f4f7f5] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">Email sign-in</p><span className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-[#176255]">Active</span></div><p className="mt-1 text-xs font-medium leading-5 text-[#718078]">Your registered email identifies this account.</p></div><div className="rounded-xl bg-[#f4f7f5] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">Two-factor authentication</p><span className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-[#7a8982]">Planned</span></div><p className="mt-1 text-xs font-medium leading-5 text-[#718078]">An additional sign-in safeguard is not yet available.</p></div></div></section>
            <section className="rounded-2xl border border-red-200 bg-red-50/70 p-6" aria-labelledby="danger-title"><Trash2 className="size-5 text-red-600" /><h2 id="danger-title" className="mt-4 font-black text-red-950">Delete account</h2><p className="mt-2 text-xs font-medium leading-5 text-red-800/75">This permanently removes your profile and cannot be undone.</p><button type="button" onClick={() => setModalVisible(true)} className="mt-5 min-h-10 rounded-lg border border-red-300 bg-white px-4 text-xs font-black text-red-700 transition hover:bg-red-100">Delete profile</button></section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
