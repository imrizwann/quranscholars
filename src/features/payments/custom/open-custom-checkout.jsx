import { createRoot } from "react-dom/client";
import CustomCheckout from "./CustomCheckout.jsx";
import { validateCustomOrder } from "./custom-checkout-sdk.js";

let active = false;

export function openCustomCheckout({ payment, course, user, onInstance }) {
  validateCustomOrder(payment, { production: import.meta.env?.PROD, liveEnabled: import.meta.env?.VITE_CUSTOM_CHECKOUT_LIVE_ENABLED === "true" });
  if (active) return Promise.reject(new Error("A checkout is already open."));
  active = true;
  return new Promise(resolve => {
    const host = document.createElement("div");
    host.dataset.customCheckout = "true";
    document.body.appendChild(host);
    const root = createRoot(host);
    const returnFocus = document.activeElement;
    let settled = false;
    const finish = response => {
      if (settled) return;
      settled = true;
      queueMicrotask(() => {
        root.unmount(); host.remove(); active = false;
        if (returnFocus?.isConnected) returnFocus.focus();
        resolve(response);
      });
    };
    if (onInstance?.({ close: () => finish(null) }) === false) { finish(null); return; }
    root.render(<CustomCheckout payment={payment} course={course} user={user} onFinish={finish} embeddedQr={import.meta.env?.VITE_CUSTOM_CHECKOUT_EMBEDDED_QR === "true"} />);
  });
}
