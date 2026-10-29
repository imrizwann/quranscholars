import { useRef } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils.js";

export default function ConfirmationModal({
  open, title, description, children, confirmLabel = "Confirm",
  cancelLabel = "Cancel", danger = false, onConfirm, onCancel,
  busy = false,
}) {
  const cancel = useRef(null);
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !busy) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="qs-backdrop-motion fixed inset-0 z-[110] bg-foreground/40" />
        <Dialog.Popup initialFocus={cancel} className="qs-dialog-motion fixed left-1/2 top-1/2 z-[111] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 text-foreground outline-none">
          <Dialog.Title className="text-xl font-semibold tracking-tight">{title}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</Dialog.Description>
          {children}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Dialog.Close ref={cancel} disabled={busy} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold outline-none hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60">{cancelLabel}</Dialog.Close>
            <button type="button" disabled={busy} onClick={onConfirm} className={cn("min-h-11 rounded-lg px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60", danger ? "bg-destructive text-white hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
              {confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
