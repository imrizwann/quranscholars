import { useSelector } from "react-redux";
import { useGetAvatarUrlQuery } from "@/services/api/user/fileUploadApis.js";

export default function useProfilePhoto() {
  const user = useSelector((state) => state.user.user);
  // The request still derives ownership from the cookie; the ID only separates caches.
  return useGetAvatarUrlQuery(user?._id, {
    skip: !user,
    refetchOnMountOrArgChange: 1800,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 45 * 60 * 1000,
    skipPollingIfUnfocused: true,
  });
}
