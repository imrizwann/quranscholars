import { useEffect, useRef, useState } from "react";
import { useUploadAvatarMutation } from "@/services/api/user/fileUploadApis.js";
import { userMessage } from "@/lib/user-messages.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024;

// Choose, preview and save a profile photo. Shared by /profile and the workspace profile.
export default function useAvatarUpload() {
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef(null);
  const uploading = useRef(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function openPicker() {
    fileInput.current?.click();
  }

  function chooseImage(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setMessage("");
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (!selected.size || selected.size > MAX_BYTES) {
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
      setError(userMessage(failure, "We could not update your profile photo. Please try again."));
    } finally {
      uploading.current = false;
    }
  }

  function cancel() {
    setFile(null);
    setError("");
  }

  return { file, previewUrl, error, message, isUploading, fileInput, openPicker, chooseImage, savePhoto, cancel };
}
