import { useId, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { DayPicker } from "react-day-picker";
import { CalendarDays } from "lucide-react";
import SelectField from "./SelectField.jsx";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only.js";
import "react-day-picker/style.css";
import "./form-controls.css";

const earliestDate = new Date(1900, 0, 1);

function CalendarDropdown({ options, value, onChange, disabled, "aria-label": label }) {
  return <SelectField
    aria-label={label}
    value={value}
    options={options || []}
    disabled={disabled}
    onChange={(next) => onChange?.({ target: { value: String(next) } })}
  />;
}

export default function DateOfBirthPicker({ id, value, onChange, onBlur, triggerRef, disabled, error }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const [open, setOpen] = useState(false);
  const selected = parseDateOnly(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return <div>
    <Popover.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) onBlur?.(); }}>
      <Popover.Trigger
        id={fieldId}
        ref={triggerRef}
        disabled={disabled}
        className="qs-date-trigger"
        aria-label={selected ? `Date of birth: ${selected.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}` : "Choose date of birth"}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        data-placeholder={!selected || undefined}
      >
        <span>{selected ? selected.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Choose date of birth"}</span>
        <CalendarDays size={18} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" collisionPadding={12} className="qs-date-positioner">
          <Popover.Popup className="qs-date-popup qs-popup-motion">
            <Popover.Title className="qs-date-title">Date of birth</Popover.Title>
            <Popover.Description className="qs-date-description">Choose your month and year, then select the day.</Popover.Description>
            <DayPicker
              className="qs-date-calendar"
              mode="single"
              required
              selected={selected}
              defaultMonth={selected || today}
              startMonth={earliestDate}
              endMonth={today}
              disabled={[{ before: earliestDate }, { after: today }]}
              captionLayout="dropdown"
              reverseYears
              hideNavigation
              fixedWeeks
              components={{ Dropdown: CalendarDropdown }}
              onSelect={(date) => {
                if (!date || date < earliestDate || date > today) return;
                onChange(formatDateOnly(date));
                setOpen(false);
                onBlur?.();
              }}
            />
            <div className="qs-date-actions">
              <button type="button" className="cw-button cw-button-compact" disabled={!value} onClick={() => { onChange(""); setOpen(false); onBlur?.(); }}>Clear date</button>
              <Popover.Close className="cw-button cw-button-compact">Close</Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
    {error && <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-destructive" role="alert">{error}</p>}
  </div>;
}
