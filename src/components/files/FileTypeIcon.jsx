import { File, FileArchive, FileImage, FileSpreadsheet, FileText, FileVideo, Headphones, NotebookPen, Presentation } from "lucide-react";
import { filePresentation } from "./file-types.js";
import "./file-types.css";

const icons = { pdf: FileText, document: FileText, spreadsheet: FileSpreadsheet, presentation: Presentation, image: FileImage, video: FileVideo, audio: Headphones, text: FileText, notes: NotebookPen, archive: FileArchive, file: File };

export default function FileTypeIcon({ name, contentType, type, kind, size = "md", className = "" }) {
  const file = filePresentation({ name, contentType, type, kind });
  const Icon = icons[file.kind];
  return <span className={`qs-file-icon ${className}`} data-file-kind={file.kind} data-size={size} aria-hidden="true"><Icon size={size === "sm" ? 16 : 20} strokeWidth={1.8} /></span>;
}

export function FileTypeLabel({ name, contentType, type, kind }) {
  const file = filePresentation({ name, contentType, type, kind });
  return <span className="qs-file-label" data-file-kind={file.kind}>{file.label}</span>;
}
