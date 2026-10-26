import { userMessage } from "@/lib/user-messages.js";
import { forwardRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { setUser } from "@/store/slices/userSlice.js";
import {
  useDeleteProfileMutation } from
"@/services/api/user/userAuthApis.js";

const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeInOut" } }
};

const panelMotion = {
  initial: { opacity: 0, y: 18, scale: 0.98, filter: "blur(2px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.99,
    filter: "blur(1px)",
    transition: { duration: 0.18, ease: "easeInOut" }
  }
};

const ProfileDeleteModal = forwardRef(({ onClose }, ref) => {
  const [password, setPassword] = useState("");
  const [deleteProfile, { isLoading }] = useDeleteProfileMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const showToast = ({ variant, title, description }) => {
    const isError = variant === "error";

    toast.custom((toastId) =>
    <div>
        <div>
          {isError ?
        <AlertTriangle /> :

        <CheckCircle2 />
        }
          <div>
            <p>{title}</p>
            <p>{description}</p>
          </div>
          <button
          type="button"

          onClick={() => toast.dismiss(toastId)}
          aria-label="Dismiss toast">
          
            <X />
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLoading, onClose]);

  const handleDeleteProfile = async () => {
    if (!password.trim()) {
      showToast({
        variant: "error",
        title: "Password required",
        description: "Enter your password to confirm profile deletion."
      });
      return;
    }

    try {
      await deleteProfile({ password }).unwrap();
      // Account deletion already clears the session cookie.

      localStorage.removeItem("user");
      dispatch(setUser(null));
      showToast({
        variant: "success",
        title: "Account deleted",
        description:
        "Your account has been deleted. You have been signed out."
      });
      onClose();
      navigate("/");
    } catch (apiError) {
      showToast({
        variant: "error",
        title: "Account could not be deleted",
        description:
        userMessage(apiError, "We could not delete your account. Please try again.")
      });
    }
  };

  const modalContent =
  <motion.div
    ref={ref}
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-profile-title"

    onClick={() => {
      if (!isLoading) onClose();
    }}
    variants={overlayMotion}
    initial="initial"
    animate="animate"
    exit="exit">
    
      <motion.div

      onClick={(event) => event.stopPropagation()}
      variants={panelMotion}>
      
        <div>
          <div>
            <div>
              <AlertTriangle />
            </div>
            <div>
              <h2 id="delete-profile-title">
                Delete profile
              </h2>
              <p>
                This action is permanent and all account data will be removed.
              </p>
            </div>
          </div>
          <button
          type="button"
          aria-label="Close modal"

          onClick={onClose}
          disabled={isLoading}>
          
            <X />
          </button>
        </div>

        <div>
          <label htmlFor="delete-profile-password">
            Confirm with your password
          </label>
          <input
          id="delete-profile-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          autoFocus />

        
        </div>

        <div>
          <button
          type="button"
          onClick={onClose}
          disabled={isLoading}>

          
            Cancel
          </button>
          <button
          type="button"
          onClick={handleDeleteProfile}
          disabled={isLoading}>

          
            {isLoading ? <Loader2 /> : null}
            Delete permanently
          </button>
        </div>
      </motion.div>
    </motion.div>;


  if (typeof document === "undefined") return modalContent;
  return createPortal(modalContent, document.body);
});

ProfileDeleteModal.displayName = "ProfileDeleteModal";

export default ProfileDeleteModal;
