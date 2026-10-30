import { useId, useMemo } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils.js";
import Spinner from "@/components/feedback/Spinner.jsx";
import "./form-controls.css";

export function SelectOption({ value, label, description, disabled = false }) {
  return <Select.Item value={value} label={label} disabled={disabled} className="qs-select-option">
    <div className="min-w-0 flex-1"><Select.ItemText className="block break-words font-medium">{label}</Select.ItemText>{description && <span className="mt-1 block text-xs text-muted-foreground">{description}</span>}</div>
    <Select.ItemIndicator><Check className="size-4 text-primary" aria-hidden="true" /></Select.ItemIndicator>
  </Select.Item>;
}

// onChange receives the option value, not a DOM event. `name` supports FormData.
// Options may be strings or { value, label, description?, disabled? } objects.
export default function SelectField({
  id, name, label, options = [], value, defaultValue, onChange, onBlur, inputRef, triggerRef,
  placeholder = "Select an option", disabled = false, required = false,
  loading = false, emptyMessage = "No options available", error, description,
  className, triggerClassName, menuAlign = "left", labelPlacement = "above",
  "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid,
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const labelId = `${fieldId}-label`;
  const helpId = `${fieldId}-help`;
  const items = useMemo(() => options.map((option) => typeof option === "string" ? { value: option, label: option } : option), [options]);
  return <div className={cn("qs-select-field", className)}>
    {label && labelPlacement === "above" && <label data-select-label id={labelId} htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-foreground">{label}{required && <span aria-hidden="true"> *</span>}</label>}
    <Select.Root id={fieldId} name={name} value={value} defaultValue={defaultValue} onValueChange={onChange} inputRef={inputRef} items={items} required={required} disabled={disabled || loading} modal={false}>
      <Select.Trigger ref={triggerRef} id={fieldId} onBlur={onBlur} aria-label={ariaLabel || (labelPlacement === "inline" ? label : undefined)} aria-labelledby={ariaLabelledBy || (label && labelPlacement === "above" ? labelId : undefined)} aria-describedby={[ariaDescribedBy, error || description ? helpId : null].filter(Boolean).join(" ") || undefined} aria-invalid={ariaInvalid || Boolean(error)} aria-busy={loading || undefined} className={cn("qs-select-trigger", error && "qs-field-invalid", triggerClassName)}>
        <span className="min-w-0 truncate">{label && labelPlacement === "inline" && <span className="mr-1.5 text-xs font-bold text-muted-foreground">{label}:</span>}<Select.Value placeholder={loading ? "Loading options" : placeholder} /></span>
        {loading ? <Spinner size={16} label="Loading options" /> : <Select.Icon><ChevronDown className="size-4 shrink-0" aria-hidden="true" /></Select.Icon>}
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={6} align={menuAlign === "right" ? "end" : "start"} alignItemWithTrigger={false} className="qs-select-positioner">
          <Select.Popup className="qs-popup-motion qs-select-popup">
            <Select.List className="qs-select-list">{items.length ? items.map((option) => <SelectOption key={option.value} {...option} />) : <div className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</div>}</Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
    {(error || description) && <p id={helpId} className={cn("mt-1.5 text-sm", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>{error || description}</p>}
  </div>;
}
