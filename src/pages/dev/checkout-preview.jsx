import { createRoot } from "react-dom/client";
import { useCallback, useState } from "react";
import "@/styles/globals.css";

// Standalone Vite development entry, never imported by the application or production build.
if (import.meta.env.DEV) {
  const { default: CustomCheckout } = await import("@/features/payments/custom/CustomCheckout.jsx");
  class PreviewSDK {
    events = {};
    timer;
    once(name, callback) {
      if (name === "ready") queueMicrotask(() => callback({ methods: { card: true, upi: true, wallet: { amazonpay: true, mobikwik: true }, netbanking: { HDFC: "HDFC Bank", ICIC: "ICICI Bank", SBIN: "State Bank of India", UTIB: "Axis Bank" } } }));
    }
    on(name, callback) { this.events[name] = callback; }
    getSupportedUpiIntentApps() { return Promise.resolve(["gpay", "phonepe", "paytm", "any"]); }
    createPayment() {
      // No network, persistence, payment data capture, real QR or application launch.
      this.timer = setTimeout(() => this.events["payment.success"]?.({ razorpay_order_id: "order_preview", razorpay_payment_id: "pay_preview", razorpay_signature: "a".repeat(64) }), 1200);
    }
    emit() { clearTimeout(this.timer); }
  }
  const sdkLoader = () => Promise.resolve(PreviewSDK);
  const payment = { state: "pending", amountMinor: 149900, currency: "INR", checkout: { provider: "razorpay", orderId: "order_preview", publicKey: "rzp_test_preview" } };
  const course = { title: "Quran recitation foundations" };
  const user = { email: "learner@example.test", phone: "+919000000000" };
  const CheckoutPreview = () => {
    const [open, setOpen] = useState(true);
    const [completed, setCompleted] = useState(false);
    const finish = useCallback(response => { setCompleted(Boolean(response)); setOpen(false); }, []);
    return <main className="public-page" style={{ paddingTop: 48 }}>
      <p className="public-eyebrow">Checkout design review</p>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBlock: 16 }}>Custom checkout preview</h1>
      <p style={{ maxWidth: 640, lineHeight: 1.8 }}>This preview uses sample course data and a simulated payment provider. No order, payment, or enrollment is created here.</p>
      {completed && <p role="status" style={{ marginTop: 20 }}>Preview complete. No payment was submitted.</p>}
      <div className="public-actions"><button className="cw-button cw-primary" onClick={() => { setCompleted(false); setOpen(true); }}>Open checkout preview</button><a href="/" className="cw-button">Back to website</a></div>
      {open && <CustomCheckout payment={payment} course={course} user={user} onFinish={finish} sdkLoader={sdkLoader} designPreview />}
    </main>;
  };
  createRoot(document.getElementById("root")).render(<CheckoutPreview />);
} else {
  document.getElementById("root").textContent = "This design preview is available only in development.";
}
