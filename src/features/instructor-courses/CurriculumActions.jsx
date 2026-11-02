import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical } from "lucide-react";
import Spinner from "@/components/feedback/Spinner.jsx";
import { useRef } from "react";

export default function CurriculumActions({ label, items, disabled, loading = false }) {
  const actionSelected = useRef(false);
  const visibleItems = items.filter(Boolean);
  return <Menu.Root modal={false}>
    <Menu.Trigger className="cw-actions-trigger" aria-label={label} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading ? <Spinner size={15} decorative /> : <EllipsisVertical size={17} aria-hidden="true" />}
    </Menu.Trigger>
    <Menu.Portal><Menu.Positioner align="end" sideOffset={6} collisionPadding={12} className="cw-actions-positioner"><Menu.Popup className="cw-actions-popup qs-popup-motion" aria-label={label} finalFocus={() => { const restore = !actionSelected.current; actionSelected.current = false; return restore; }}>
      {visibleItems.map(({ label, icon: Icon, danger, onClick, disabled: itemDisabled }, index) => <div key={label}>
        {danger && index > 0 && !visibleItems[index - 1].danger && <Menu.Separator className="cw-actions-separator" />}
        <Menu.Item className="cw-actions-item" data-danger={danger || undefined} disabled={disabled || loading || itemDisabled} onClick={() => { actionSelected.current = true; onClick(); }}>
          {Icon && <Icon size={15} aria-hidden="true" />}<span>{label}</span>
        </Menu.Item>
      </div>)}
    </Menu.Popup></Menu.Positioner></Menu.Portal>
  </Menu.Root>;
}
