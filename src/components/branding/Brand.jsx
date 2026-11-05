export default function Brand({ caption = false }) {
  return <>
    <img className="brand-icon" src="/logo512x512.png" alt="" width="32" height="32" decoding="async" />
    <span className="brand-name">QuranScholar{caption && <span className="brand-caption">A journey of knowledge</span>}</span>
  </>;
}
