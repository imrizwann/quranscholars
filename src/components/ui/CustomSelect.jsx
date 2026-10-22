import SelectField from "./SelectField.jsx";

// Preserve the compact filter API used by the existing course catalog.
export default function CustomSelect(props) {
  return <SelectField labelPlacement="inline" {...props} />;
}
