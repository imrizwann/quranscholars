import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput({ id, label, type = "text", hint, labelAction, className = "", ...props }) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return <div className="auth-field">
    <div className="auth-field-heading"><label htmlFor={id}>{label}</label>{labelAction}</div>
    <div className={`auth-field-control${password ? " auth-field-control--password" : ""}`}>
      <input {...props} id={id} type={password && visible ? "text" : type} aria-describedby={[props["aria-describedby"], hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined} className={`auth-field-input ${className}`} />
      {password && <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} aria-controls={id} disabled={props.disabled} onClick={() => setVisible(value => !value)} className="auth-password-toggle">{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>}
    </div>
    {hint && <p id={`${id}-hint`} className="auth-field-hint">{hint}</p>}
  </div>;
}
