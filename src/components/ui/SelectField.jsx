import { useId, useMemo } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils.js";
import Spinner from "@/components/feedback/Spinner.jsx";

export function SelectOption({ value, label, description, disabled = false }) {
  return <Select.Item value={value} label={label} disabled={disabled} className="flex min-h-11 cursor-default items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-primary/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-45">
    <div className="min-w-0 flex-1"><Select.ItemText className="block break-words font-medium">{label}</Select.ItemText>{description && <span className="mt-1 block text-xs text-muted-foreground">{description}</span>}</div>
    <Select.ItemIndicator><Check className="size-4 text-primary" aria-hidden="true" /></Select.ItemIndicator>
  </Select.Item>;
}

// onChange receives the option value, not a DOM event. `name` supports FormData.
// Options may be strings or { value, label, description?, disabled? } objects.
export default function SelectField({
  id, name, label, options = [], value, defaultValue, onChange, onBlur, inputRef,
  placeholder = "Select an option", disabled = false, required = false,
  loading = false, emptyMessage = "No options available", error, description,
  className, triggerClassName, menuAlign = "left", labelPlacement = "above",
  "aria-label": ariaLabel,
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const labelId = `${fieldId}-label`;
  const helpId = `${fieldId}-help`;
  const items = useMemo(() => options.map((option) => typeof option === "string" ? { value: option, label: option } : option), [options]);
  return <div className={cn("min-w-0", className)}>
    {label && labelPlacement === "above" && <label data-select-label id={labelId} htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-foreground">{label}{required && <span aria-hidden="true"> *</span>}</label>}
    <Select.Root id={fieldId} name={name} value={value} defaultValue={defaultValue} onValueChange={onChange} inputRef={inputRef} items={items} required={required} disabled={disabled || loading} modal={false}>
      <Select.Trigger id={fieldId} onBlur={onBlur} aria-label={ariaLabel || (labelPlacement === "inline" ? label : undefined)} aria-labelledby={label && labelPlacement === "above" ? labelId : undefined} aria-describedby={error || description ? helpId : undefined} aria-invalid={Boolean(error)} aria-busy={loading || undefined} className={cn("flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-white px-3 py-2 text-left text-sm text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60", error && "border-destructive", triggerClassName)}>
        <span className="min-w-0 truncate">{label && labelPlacement === "inline" && <span className="mr-1.5 text-xs font-bold text-muted-foreground">{label}:</span>}<Select.Value placeholder={loading ? "Loading options" : placeholder} /></span>
        {loading ? <Spinner size={16} label="Loading options" /> : <Select.Icon><ChevronDown className="size-4 shrink-0" aria-hidden="true" /></Select.Icon>}
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={6} align={menuAlign === "right" ? "end" : "start"} alignItemWithTrigger={false} className="z-[100] outline-none">
          <Select.Popup className="qs-popup-motion w-[var(--anchor-width)] min-w-32 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-white p-1 shadow-xl outline-none">
            <Select.List className="max-h-[min(18rem,calc(var(--available-height)-0.75rem))] overflow-y-auto overscroll-contain outline-none">{items.length ? items.map((option) => <SelectOption key={option.value} {...option} />) : <div className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</div>}</Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
    {(error || description) && <p id={helpId} className={cn("mt-1.5 text-sm", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>{error || description}</p>}
  </div>;
}
