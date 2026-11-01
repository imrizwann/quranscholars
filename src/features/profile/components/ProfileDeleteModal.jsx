import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteProfileMutation } from "@/services/api/user/userAuthApis.js";
import { clearAuthenticatedState } from "@/features/auth/logout.js";
import { userMessage } from "@/lib/user-messages.js";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";

export default function ProfileDeleteModal({ open, onClose, returnFocus }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleteProfile, { isLoading }] = useDeleteProfileMutation();
  const pending = useRef(false);
  const passwordInput = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => { if (!open) { setPassword(""); setError(""); } }, [open]);

  async function confirm() {
    if (pending.current) return;
    if (!password.trim()) { setError("Enter your password to confirm account deletion."); passwordInput.current?.focus(); return; }
    pending.current = true;
    setError("");
    try {
      await deleteProfile({ password }).unwrap();
      clearAuthenticatedState(dispatch);
      toast.success("Your account has been deleted.");
      onClose();
      navigate("/", { replace: true });
    } catch (failure) {
      setError(userMessage(failure, "We could not delete your account. Please try again."));
    } finally { pending.current = false; }
  }

  return <ConfirmationModal returnFocus={returnFocus} open={open} title="Delete your account?" description="You will lose access to this account. This action is permanent and cannot be undone. Enter your current password to confirm." confirmLabel="Delete account" busyLabel="Deleting account" danger busy={isLoading} onConfirm={confirm} onCancel={onClose}>
    <form className="profile-delete-form" onSubmit={(event) => { event.preventDefault(); confirm(); }}>
      <label htmlFor="delete-profile-password">Current password</label>
      <input ref={passwordInput} id="delete-profile-password" className="profile-input" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} disabled={isLoading} aria-invalid={Boolean(error)} aria-describedby={error ? "delete-profile-error" : undefined} />
      <button type="submit" hidden aria-hidden="true" tabIndex={-1}>Confirm account deletion</button>
    </form>
    {error && <p id="delete-profile-error" className="qs-confirm-error" role="alert">{error}</p>}
  </ConfirmationModal>;
}
