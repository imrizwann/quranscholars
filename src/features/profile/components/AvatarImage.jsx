import { useState } from "react";

export default function AvatarImage({ src, fallback, className, alt = "", size }) {
  const [failed, setFailed] = useState(null);
  if (!src || src === failed) return fallback;
  return <img src={src} alt={alt} width={size} height={size} decoding="async"
    referrerPolicy="no-referrer" className={className} onError={() => setFailed(src)} />;
}
