import AvatarImage from "./AvatarImage.jsx";
import { getProfileInitials } from "../profile-initials.js";
import "./profile-avatar.css";

export default function ProfileAvatar({ src, name, size = 36 }) {
  return <span className="profile-avatar-badge" style={{ width: size, height: size }} aria-hidden="true">
    <AvatarImage src={src} size={size} fallback={getProfileInitials(name)} />
  </span>;
}
