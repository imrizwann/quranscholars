import { BookOpenText } from "lucide-react";

export default function UrduCompanion({ title, description, tone = "dark", className = "" }) {
  const light = tone === "light";
  return <aside className={`min-w-0 rounded-xl border p-6 text-right ${light ? "border-border bg-surface text-foreground" : "border-white/15 bg-white/5 text-white"} ${className}`} lang="ur" dir="rtl" aria-label="Urdu introduction">
    <span className={`mr-auto grid size-10 place-items-center rounded-lg ${light ? "bg-primary/10 text-primary" : "bg-white/10 text-white"}`}><BookOpenText size={20} aria-hidden="true" /></span>
    <p className="font-urdu mt-4 text-[1.45rem] font-bold leading-[2.05] sm:text-[1.7rem]">{title}</p>
    {description && <p className={`font-urdu mt-3 text-[0.98rem] font-medium leading-[2.15] sm:text-[1.04rem] ${light ? "text-muted-foreground" : "text-white/70"}`}>{description}</p>}
    <p className={`mt-5 border-t pt-4 font-body text-xs ${light ? "border-border text-muted-foreground" : "border-white/15 text-white/70"}`} dir="ltr">Aalim Ul Quran · Learn with purpose</p>
  </aside>;
}
