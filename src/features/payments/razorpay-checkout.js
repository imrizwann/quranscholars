import { userFacingError } from "../../lib/user-messages.js";

const scriptUrl = "https://checkout.razorpay.com/v1/checkout.js";
let loading;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl; script.async = true;
    const fail = () => { clearTimeout(timer); script.onload = null; script.onerror = null; script.remove(); reject(userFacingError("Payment checkout could not load. Check your connection and select Continue payment to retry the same checkout.")); };
    const timer = setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.Razorpay) { fail(); return; }
      clearTimeout(timer); script.onload = null; script.onerror = null; resolve(window.Razorpay);
    };
    document.head.appendChild(script);
  }).finally(() => { loading = null; });
  return loading;
}

export async function openRazorpayCheckout({ payment, course, user, onInstance, signal }) {
  const { checkout } = payment;
  if (checkout?.provider !== "razorpay" || !/^order_[A-Za-z0-9]+$/.test(checkout.orderId || "") ||
      !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(checkout.publicKey || "") ||
      (import.meta.env?.PROD && !/^rzp_live_/.test(checkout.publicKey || "")) ||
      !Number.isSafeInteger(payment.amountMinor) || payment.amountMinor <= 0 || !/^[A-Z]{3}$/.test(payment.currency || "")) {
    throw userFacingError("Online payment is not available for this checkout yet. Please contact our team.");
  }
  // Razorpay accepts a brand colour, not arbitrary styles inside its secure frame.
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const color = /^#[a-f0-9]{6}$/i.test(primary) ? primary : "#0f766e";
  return new Promise((resolve, reject) => {
    let completed = false, instance;
    const finish = (value, error) => {
      if (completed) return;
      completed = true;
      signal?.removeEventListener("abort", cancel);
      if (error) reject(error); else resolve(value);
    };
    const cancel = () => {
      // Settle even when the SDK never fires ondismiss. Never cancel an order:
      // the caller reconciles it before allowing the same checkout to resume.
      finish(null);
      instance?.close();
    };
    if (signal?.aborted) { finish(null); return; }
    signal?.addEventListener("abort", cancel, { once: true });
    loadRazorpay().then(Razorpay => {
      if (completed) return; // A slow script must not open an abandoned checkout.
      instance = new Razorpay({
        key: checkout.publicKey, order_id: checkout.orderId,
        amount: payment.amountMinor, currency: payment.currency,
        name: "DarsLearn", description: course.title,
        image: new URL("/web-app-manifest-192x192.png", window.location.origin).href,
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color, backdrop_color: "#fcfcfa" },
        modal: { backdropclose: false, confirm_close: true, ondismiss: () => finish(null) },
        handler: response => {
          if (completed) return;
          if (response.razorpay_order_id !== checkout.orderId) { finish(null, userFacingError("We could not verify this payment. Check payment status before trying again.")); return; }
          finish({ paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
        },
      });
      // A failed payment attempt can be retried inside the same checkout/order.
      // Never turn its browser event into a local payment state or enrollment.
      if (onInstance?.(instance) === false) { finish(null); return; }
      if (completed) return;
      instance.open();
    }).catch(error => finish(null, error?.userMessage ? error : userFacingError("Payment checkout could not open. Check payment status before selecting Continue payment.")));
  });
}
