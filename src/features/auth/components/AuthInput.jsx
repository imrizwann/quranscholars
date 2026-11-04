import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput({ id, label, type = "text", hint, ...props }) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return <div>
    <label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>
    <div className="relative mt-2">
      <input {...props} id={id} type={password && visible ? "text" : type} aria-describedby={[props["aria-describedby"], hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined} className={`h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60 ${password ? "pr-14" : ""}`} />
      {password && <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} aria-controls={id} disabled={props.disabled} onClick={() => setVisible(value => !value)} className="absolute right-0.5 top-0.5 grid size-11 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60">{visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button>}
    </div>
    {hint && <p id={`${id}-hint`} className="mt-2 text-xs text-muted-foreground">{hint}</p>}
  </div>;
}
