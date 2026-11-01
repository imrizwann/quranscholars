import { useRef } from "react";
import { Dialog } from "@base-ui/react/dialog";
import AsyncButton from "./AsyncButton.jsx";
import "./confirmation-modal.css";

export default function ConfirmationModal({
  open, title, description, children, confirmLabel = "Confirm",
  cancelLabel = "Cancel", danger = false, onConfirm, onCancel,
  busy = false, busyLabel = "Please wait", returnFocus,
}) {
  const cancel = useRef(null);
  return <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !busy) onCancel(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="qs-confirm-backdrop qs-backdrop-motion" />
      <Dialog.Popup initialFocus={cancel} finalFocus={returnFocus} className="qs-confirm-popup qs-dialog-motion" aria-busy={busy || undefined}>
        <Dialog.Title className="qs-confirm-title">{title}</Dialog.Title>
        <Dialog.Description className="qs-confirm-description">{description}</Dialog.Description>
        {children}
        <div className="qs-confirm-actions">
          <Dialog.Close ref={cancel} disabled={busy} className="cw-button">{cancelLabel}</Dialog.Close>
          <AsyncButton loading={busy} loadingLabel={busyLabel} onClick={onConfirm} className={`cw-button ${danger ? "qs-confirm-danger" : "cw-primary"}`}>{confirmLabel}</AsyncButton>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
