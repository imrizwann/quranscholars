const formats = Object.freeze({
  pdf: { kind: "pdf", label: "PDF" },
  document: { kind: "document", label: "Document" },
  spreadsheet: { kind: "spreadsheet", label: "Spreadsheet" },
  presentation: { kind: "presentation", label: "Slides" },
  image: { kind: "image", label: "Image" },
  video: { kind: "video", label: "Video" },
  audio: { kind: "audio", label: "Audio" },
  text: { kind: "text", label: "Text" },
  notes: { kind: "notes", label: "Notes" },
  archive: { kind: "archive", label: "Archive" },
  file: { kind: "file", label: "File" },
});
const extensions = {
  pdf: "pdf", doc: "document", docx: "document", odt: "document", rtf: "document",
  xls: "spreadsheet", xlsx: "spreadsheet", csv: "spreadsheet", ods: "spreadsheet",
  ppt: "presentation", pptx: "presentation", odp: "presentation",
  jpg: "image", jpeg: "image", png: "image", webp: "image", gif: "image", svg: "image", avif: "image",
  mp4: "video", mov: "video", webm: "video", mkv: "video", m4v: "video",
  mp3: "audio", wav: "audio", m4a: "audio", ogg: "audio", aac: "audio", flac: "audio",
  txt: "text", md: "text", zip: "archive", rar: "archive", "7z": "archive", gz: "archive",
};
const mimeTypes = {
  "application/pdf": "pdf", "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.oasis.opendocument.text": "document", "application/rtf": "document",
  "application/vnd.ms-excel": "spreadsheet", "text/csv": "spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "spreadsheet",
  "application/vnd.oasis.opendocument.spreadsheet": "spreadsheet",
  "application/vnd.ms-powerpoint": "presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "presentation",
  "application/vnd.oasis.opendocument.presentation": "presentation",
  "text/plain": "text", "text/markdown": "text",
  "application/zip": "archive", "application/x-zip-compressed": "archive",
  "application/x-7z-compressed": "archive", "application/vnd.rar": "archive", "application/gzip": "archive",
};
const own = (map, key) => Object.hasOwn(map, key) ? map[key] : undefined;

// Presentation only. Upload validation and access checks remain server-owned.
export function filePresentation({ name = "", contentType = "", type = "", kind = "" } = {}) {
  if (own(formats, kind)) return formats[kind];
  const mime = String(contentType || type).split(";")[0].trim().toLowerCase();
  const media = ["image", "video", "audio"].find(value => mime.startsWith(`${value}/`));
  const extension = String(name).trim().match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const resolved = media || own(mimeTypes, mime) || own(extensions, extension) ||
    (own(formats, mime) ? mime : own(extensions, mime)) || (mime === "slides" ? "presentation" : "file");
  return formats[resolved];
}
