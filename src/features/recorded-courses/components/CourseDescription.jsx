import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CourseDescription({ text, textClassName = "cd-description", buttonClassName = "cd-text-button cd-description-toggle" }) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const description = text?.trim() || "A detailed course description has not been added yet.";
  const characters = Array.from(description);
  const lengthy = characters.length > 600;
  const preview = lengthy ? `${characters.slice(0, 600).join("").replace(/\s+\S*$/, "").trimEnd()}…` : description;

  return <div className="course-description">
    <p id={id} className={textClassName}>{expanded ? description : preview}</p>
    {lengthy && <button type="button" className={buttonClassName} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>
      {expanded ? "Read less" : "Read more"}<ChevronDown size={16} className={expanded ? "rotate-180" : undefined} aria-hidden="true" />
    </button>}
  </div>;
}
