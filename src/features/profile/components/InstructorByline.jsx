import { Link } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar.jsx";
import { instructorProfileUrl } from "../instructor-link.js";
import "./instructor-byline.css";

export default function InstructorByline({ instructor, prefix = "By", photo = true }) {
  if (!instructor?.name) return null;
  const to = instructorProfileUrl(instructor);
  return <span className="instructor-byline">{photo && <ProfileAvatar name={instructor.name} src={instructor.avatar} size={26} />}<span>{prefix && `${prefix} `}{to ? <Link to={to}>{instructor.name}</Link> : instructor.name}</span></span>;
}
