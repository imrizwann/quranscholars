import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLogoutMutation } from "@/services/api/user/userAuthApis.js";
import { userMessage } from "@/lib/user-messages.js";
import { logoutSession } from "./logout.js";

export default function useSignOut() {
  const [logout, { isLoading }] = useLogoutMutation();
  const pending = useRef(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function signOut() {
    if (pending.current) return false;
    pending.current = true;
    try {
      await logoutSession(logout, dispatch);
      navigate("/", { replace: true });
      return true;
    } catch (error) {
      toast.error(userMessage(error, "We could not sign you out. Please try again."));
      return false;
    } finally {
      pending.current = false;
    }
  }

  return { signOut, isSigningOut: isLoading };
}
