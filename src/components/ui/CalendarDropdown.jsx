import SelectField from "./SelectField.jsx";

export default function CalendarDropdown({ options, value, onChange, disabled, "aria-label": label }) {
  return <SelectField aria-label={label} value={value} options={options || []} disabled={disabled} onChange={next => onChange?.({ target: { value: String(next) } })} />;
}
