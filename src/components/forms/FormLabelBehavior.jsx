import { useEffect } from "react";

const interactive = "input, textarea, select, button, a[href], summary, [role='button'], [role='checkbox'], [role='radio'], [role='switch'], [role='slider'], [contenteditable='true']";
const labelActions = "input[type='checkbox'], input[type='radio'], input[type='file'], input[type='button'], input[type='submit'], input[type='reset'], input[type='image'], [role='checkbox'], [role='radio'], [role='switch']";

export default function FormLabelBehavior() {
  useEffect(() => {
    function handleClick(event) {
      const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
      if (!target || target.closest(interactive)) return;
      const control = target.closest("label")?.control;
      if (!control || control.matches(labelActions)) return;
      // Cancel only the label's native forwarded click. Keep its accessible
      // association, and allow direct control clicks and keyboard interaction.
      event.preventDefault();
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
  return null;
}
