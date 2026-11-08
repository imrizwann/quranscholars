import { useId, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { DayPicker } from "react-day-picker";
import { CalendarDays } from "lucide-react";
import CalendarDropdown from "./CalendarDropdown.jsx";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only.js";
import "./form-controls.css";

export default function DateRangePicker({ label = "Custom dates", fromDate = "", toDate = "", onChange, disabled = false, maxDate }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState();
  const from = parseDateOnly(fromDate), to = parseDateOnly(toDate);
  const today = parseDateOnly(maxDate) || new Date(); today.setHours(0, 0, 0, 0);
  const text = date => date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const summary = from && to ? `${text(from)} – ${text(to)}` : "Choose a date range";
  return <div className="revenue-date-range">
    <label id={`${id}-label`} htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>
    <Popover.Root open={open} onOpenChange={next => { setOpen(next); if (next) setDraft({ from, to }); }}>
      <Popover.Trigger id={id} disabled={disabled} className="qs-date-trigger" aria-labelledby={`${id}-label`}><span>{summary}</span><CalendarDays size={18} aria-hidden="true" /></Popover.Trigger>
      <Popover.Portal><Popover.Positioner align="start" sideOffset={8} collisionPadding={12} className="qs-date-positioner"><Popover.Popup className="qs-date-popup qs-popup-motion">
        <Popover.Title className="qs-date-title">Choose sales dates</Popover.Title>
        <Popover.Description className="qs-date-description">Select a start and end date. Both days are included, in India time.</Popover.Description>
        <DayPicker className="qs-date-calendar" mode="range" selected={draft} onSelect={setDraft} defaultMonth={from || today} startMonth={new Date(2000, 0, 1)} endMonth={today} disabled={{ after: today }} captionLayout="dropdown" reverseYears fixedWeeks components={{ Dropdown: CalendarDropdown }} />
        <p className="qs-date-description" aria-live="polite">{draft?.from ? draft.to ? `${text(draft.from)} – ${text(draft.to)}` : "Now select the end date." : "Select the start date."}</p>
        <div className="qs-date-actions"><button type="button" className="cw-button cw-button-compact" onClick={() => { onChange({ fromDate: "", toDate: "" }); setOpen(false); }}>Clear</button><Popover.Close className="cw-button cw-button-compact">Cancel</Popover.Close><button type="button" className="cw-button cw-primary cw-button-compact" disabled={!draft?.from || !draft?.to} onClick={() => { onChange({ fromDate: formatDateOnly(draft.from), toDate: formatDateOnly(draft.to) }); setOpen(false); }}>Apply dates</button></div>
      </Popover.Popup></Popover.Positioner></Popover.Portal>
    </Popover.Root>
  </div>;
}
