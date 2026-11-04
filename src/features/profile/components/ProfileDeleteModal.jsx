import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteProfileMutation, useGetAccountDeletionStatusQuery } from "@/services/api/user/userAuthApis.js";
import { clearAuthenticatedState } from "@/features/auth/logout.js";
import { userMessage } from "@/lib/user-messages.js";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";

export default function ProfileDeleteModal({ open, onClose, returnFocus }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleteProfile, { isLoading }] = useDeleteProfileMutation();
  const user = useSelector(state => state.user.user);
  const status = useGetAccountDeletionStatusQuery(user?._id, { skip: !open || !user?._id, refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const ready = status.currentData?.canDelete === true && !status.error && !status.isFetching;
  const pending = useRef(false);
  const passwordInput = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => { setPassword(""); setError(""); }, [open, user?._id]);

  async function confirm() {
    if (pending.current || !ready) return;
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
      if (failure?.status === 409) status.refetch();
    } finally { pending.current = false; }
  }

  return <ConfirmationModal returnFocus={returnFocus} open={open} title="Delete your account?" description="Deleting your account is permanent. We first check that your courses and payments are resolved. Your private application documents will be scheduled for removal; purchase and payment history is retained." confirmLabel="Delete account" busyLabel="Deleting account" danger busy={isLoading} confirmDisabled={!ready} onConfirm={confirm} onCancel={onClose}>
    {status.isFetching && <LoadingState variant="inline" label="Checking account deletion" />}
    {status.error && <div role="alert"><p className="qs-confirm-error">{userMessage(status.error)}</p><AsyncButton className="cw-button cw-button-compact" onClick={status.refetch} disabled={status.isFetching}>Check again</AsyncButton></div>}
    {!status.error && status.currentData?.canDelete === false && <div role="status">{status.currentData.blockers.map(blocker => <p className="profile-feedback" key={blocker.code}>{blocker.message}</p>)}<div className="profile-actions">{user?.role === "instructor" && status.currentData.blockers.some(item => item.code === "COURSES_REQUIRE_OWNER") && <Link className="cw-button cw-button-compact" to="/instructor/courses" onClick={onClose}>Manage courses</Link>}<Link className="cw-button cw-button-compact" to="/contact" onClick={onClose}>Contact the team</Link><AsyncButton className="cw-button cw-button-compact" onClick={status.refetch} disabled={status.isFetching}>Check again</AsyncButton></div></div>}
    {ready && <form className="profile-delete-form" onSubmit={(event) => { event.preventDefault(); confirm(); }}>
      <label htmlFor="delete-profile-password">Current password</label>
      <input ref={passwordInput} id="delete-profile-password" name="password" className="profile-input" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} disabled={isLoading} aria-invalid={Boolean(error)} aria-describedby={error ? "delete-profile-error" : undefined} />
      <button type="submit" hidden aria-hidden="true" tabIndex={-1}>Confirm account deletion</button>
    </form>}
    {error && <p id="delete-profile-error" className="qs-confirm-error" role="alert">{error}</p>}
  </ConfirmationModal>;
}
