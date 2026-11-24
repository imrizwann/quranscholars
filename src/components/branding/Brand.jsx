export default function Brand({ caption = false, tone = "auto" }) {
  return <span className="brand" data-tone={tone}>
    <span className="brand-art" role="img" aria-label="DarsLearn">
      <img className="brand-logo brand-logo-teal" src="/Logo-teal.svg" alt="" width="1270" height="204" decoding="async" />
      <img className="brand-logo brand-logo-white" src="/Logo-white.svg" alt="" width="1270" height="204" decoding="async" />
    </span>
    {caption && <span className="brand-caption">A journey of knowledge</span>}
  </span>;
}
