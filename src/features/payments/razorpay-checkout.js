const scriptUrl = "https://checkout.razorpay.com/v1/checkout.js";
let loading;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl; script.async = true;
    const fail = () => { clearTimeout(timer); script.onload = null; script.onerror = null; script.remove(); loading = null; reject(new Error("Payment checkout could not load. Please try again.")); };
    const timer = setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.Razorpay) { fail(); return; }
      clearTimeout(timer); resolve(window.Razorpay);
    };
    document.head.appendChild(script);
  });
  return loading;
}

export async function openRazorpayCheckout({ payment, course, user, onInstance }) {
  const { checkout } = payment;
  if (checkout?.provider !== "razorpay" || !/^order_[A-Za-z0-9]+$/.test(checkout.orderId || "") ||
      !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(checkout.publicKey || "") ||
      (import.meta.env?.PROD && !/^rzp_live_/.test(checkout.publicKey || "")) ||
      !Number.isSafeInteger(payment.amountMinor) || payment.amountMinor <= 0 || !/^[A-Z]{3}$/.test(payment.currency || "")) {
    throw new Error("Online payment is not available for this checkout yet. Please contact our team.");
  }
  const Razorpay = await loadRazorpay();
  // Razorpay accepts a brand colour, not arbitrary styles inside its secure frame.
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const color = /^#[a-f0-9]{6}$/i.test(primary) ? primary : "#0f766e";
  return new Promise((resolve, reject) => {
    let completed = false;
    const instance = new Razorpay({
      key: checkout.publicKey, order_id: checkout.orderId,
      amount: payment.amountMinor, currency: payment.currency,
      name: "QuranScholar", description: course.title,
      image: new URL("/web-app-manifest-192x192.png", window.location.origin).href,
      prefill: { name: user.name || "", email: user.email || "" },
      theme: { color, backdrop_color: "#18201d" },
      modal: { backdropclose: false, confirm_close: true, ondismiss: () => { if (!completed) resolve(null); } },
      handler: response => {
        completed = true;
        if (response.razorpay_order_id !== checkout.orderId) { reject(new Error("We could not verify this payment. Check payment status before trying again.")); return; }
        resolve({ paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
      },
    });
    // A failed payment attempt can be retried inside the same checkout/order.
    // Never turn its browser event into a local payment state or enrollment.
    if (onInstance?.(instance) === false) { resolve(null); return; }
    instance.open();
  });
}
