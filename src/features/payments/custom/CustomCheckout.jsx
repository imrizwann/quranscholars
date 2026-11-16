import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, CreditCard, Landmark, LockKeyhole, LoaderCircle, QrCode, ShieldCheck, Smartphone, Wallet, X } from "lucide-react";
import qrcode from "qrcode-generator";
import { appLabels, createCustomSession, loadCustomRazorpay, paymentDetails } from "./custom-checkout-sdk.js";
import "./custom-checkout.css";

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const clearCardFields = form => form?.querySelectorAll("[data-card-field]").forEach(input => { input.value = ""; });

export default function CustomCheckout({ payment, course, user, onFinish, embeddedQr = false, sdkLoader = loadCustomRazorpay, designPreview = false }) {
  const [phase, setPhase] = useState("loading");
  const [methods, setMethods] = useState({ card: false, upi: false, banks: [], wallets: [] });
  const [method, setMethod] = useState("");
  const [apps, setApps] = useState([]);
  const [app, setApp] = useState("");
  const [error, setError] = useState("");
  const [qr, setQr] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const session = useRef(null), form = useRef(null), closeButton = useRef(null), submitted = useRef(false);
  const mobile = isMobile();
  const pending = phase === "processing" || phase === "qr";
  const total = new Intl.NumberFormat("en-IN", { style: "currency", currency: payment.currency }).format(payment.amountMinor / 10 ** ({ JPY: 0, KWD: 3, BHD: 3, OMR: 3 }[payment.currency] ?? 2));

  useEffect(() => {
    let disposed = false;
    const fail = message => { if (!disposed) { setQr(null); setError(message); setPhase("uncertain"); } };
    sdkLoader().then(Razorpay => {
      if (disposed) return;
      session.current = createCustomSession(Razorpay, payment, {
        ready: available => {
          if (disposed) return;
          setMethods(available);
          setMethod(available.upi ? "upi" : available.card ? "card" : available.banks.length ? "netbanking" : available.wallets.length ? "wallet" : "");
          setPhase("ready");
        },
        success: response => { if (!disposed) onFinish(response); },
        error: fail,
        qr: data => {
          if (disposed) return;
          if (!data) return fail("This QR code has expired or is unavailable. Return to the course to check payment status.");
          try {
            const code = qrcode(0, "M");
            code.addData(data.value);
            code.make();
            setQr({ image: code.createDataURL(6, 24), expiresAt: data.expiresAt });
            setClock(Date.now());
            setPhase("qr");
          } catch { fail("The QR code could not be displayed. Return to the course to check payment status."); }
        },
      });
      session.current.apps().then(available => {
        if (!disposed) { setApps(available); setApp(available[0] || ""); }
      });
    }).catch(() => fail("Secure checkout could not load. Return to the course and try again."));
    return () => { disposed = true; session.current?.dispose(); };
  }, [payment, onFinish, sdkLoader]);

  useEffect(() => {
    if (phase !== "processing") return;
    const timer = setTimeout(() => { setPhase("uncertain"); setError("Your payment is taking longer than expected. Return to the course to check its status before paying again."); }, 120000);
    return () => clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (!qr) return;
    const update = () => {
      const now = Date.now();
      setClock(now);
      if (now >= qr.expiresAt) { setQr(null); setPhase("uncertain"); setError("This QR code has expired. Return to the course to check payment status before trying again."); }
    };
    const timer = setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, [qr]);

  function submit(event) {
    event.preventDefault();
    if (phase !== "ready" || submitted.current || !session.current) return;
    let data;
    try {
      data = paymentDetails(payment, method, Object.fromEntries(new FormData(form.current)), methods);
      if (method === "upi" && mobile && !apps.includes(app)) throw new Error("No supported UPI app is available. Choose a different payment method.");
    } catch (failure) { setError(failure.message); return; }
    submitted.current = true;
    setError("");
    setPhase("processing");
    const options = method === "upi" ? mobile ? { app } : embeddedQr ? { app: "any", flow: "qr" } : undefined : undefined;
    if (method === "upi" && !mobile && !embeddedQr) data.upi = { qr: true, timeout: 10 };
    // Send payment details directly to Razorpay, never through Redux or the LMS API.
    session.current.submit(data, options);
    clearCardFields(form.current);
    data = null;
  }

  const choices = [
    ...(methods.upi ? [{ id: "upi", title: "UPI", detail: mobile ? "Pay with a UPI app" : "Scan a QR code", Icon: Smartphone }] : []),
    ...(methods.card ? [{ id: "card", title: "Card", detail: "Debit or credit card", Icon: CreditCard }] : []),
    ...(methods.banks.length ? [{ id: "netbanking", title: "Net banking", detail: "Pay through your bank", Icon: Landmark }] : []),
    ...(methods.wallets.length ? [{ id: "wallet", title: "Wallet", detail: "Use an available wallet", Icon: Wallet }] : []),
  ];
  return <Dialog.Root open modal={!pending && phase !== "uncertain"} onOpenChange={open => { if (!open) onFinish(null); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="custom-pay-backdrop" />
      <Dialog.Popup className="custom-pay" initialFocus={closeButton} aria-busy={phase === "loading" || pending}>
        <header className="custom-pay-header"><div><span className="custom-pay-brand">QuranScholar</span><Dialog.Title>Complete your enrollment</Dialog.Title><Dialog.Description>Choose how you would like to pay for your course.</Dialog.Description></div><button ref={closeButton} className="custom-pay-close" type="button" aria-label="Close checkout and check payment status" onClick={() => onFinish(null)}><X size={20} /></button></header>
        {designPreview ? <p className="custom-pay-test" role="status">Design preview · Sample course and price. No payment is submitted. Do not enter real card details.</p> : payment.checkout.publicKey.startsWith("rzp_test_") && <p className="custom-pay-test" role="status">Test checkout · No real money will be charged</p>}
        <div className="custom-pay-layout">
          <aside className="custom-pay-summary" aria-label="Order summary">
            <span className="custom-pay-label">Your course</span><h3>{course.title}</h3>
            <p>Recorded lessons with saved progress</p>
            <dl><div><dt>Total to pay</dt><dd>{total}</dd></div></dl>
            <p className="custom-pay-access"><ShieldCheck size={20} aria-hidden="true" />Course access starts after your payment is confirmed.</p>
            <p className="custom-pay-reference">Order reference<br /><span>{payment.checkout.orderId}</span></p>
          </aside>
          <section className="custom-pay-main" aria-label="Payment details">
            {phase === "loading" && <div className="custom-pay-status" role="status"><LoaderCircle className="custom-pay-spinner" aria-hidden="true" /><h3>Preparing secure checkout</h3><p>Checking the payment methods available for your order.</p></div>}
            {phase === "ready" && <form ref={form} onSubmit={submit} data-private="true" data-clarity-mask="true">
              <fieldset className="custom-pay-methods"><legend>Payment method</legend>{choices.map(({ id, title, detail, Icon }) => <label key={id} className={method === id ? "is-selected" : ""}><input type="radio" name="method" value={id} checked={method === id} onChange={() => { clearCardFields(form.current); setError(""); setMethod(id); }} /><Icon size={22} aria-hidden="true" /><span><strong>{title}</strong><small>{detail}</small></span></label>)}</fieldset>
              {!choices.length ? <p role="status">No payment methods are available for this account. Please return to the course and contact our team.</p> : <>
                <div className="custom-pay-contact"><label>Email address<input name="email" type="email" autoComplete="email" defaultValue={user.email || ""} maxLength={254} required /></label><label>Mobile number<input name="contact" type="tel" autoComplete="tel" placeholder="e.g. +91 98765 43210" defaultValue={user.phone || ""} maxLength={20} required /></label></div>
                <div className="custom-pay-fields" key={method}>
                  {method === "card" && <><label>Card number<input data-card-field name="number" type="text" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" maxLength={23} required /></label><label>Name on card<input data-card-field name="name" type="text" autoComplete="cc-name" maxLength={100} required /></label><div className="custom-pay-card-row"><label>Expiry date<input data-card-field name="expiry" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" maxLength={7} onInput={event => { const digits = event.currentTarget.value.replace(/\D/g, ""); event.currentTarget.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2, 6)}` : digits; }} required /></label><label>Security code<input data-card-field name="cvv" type="password" inputMode="numeric" autoComplete="off" placeholder="CVV" minLength={3} maxLength={4} required /></label></div><p className="custom-pay-hint">Card details are sent directly to Razorpay. We do not store your card number or security code.</p></>}
                  {method === "netbanking" && <><label>Your bank<select name="bank" defaultValue="" required><option value="" disabled>Select your bank</option>{methods.banks.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><p className="custom-pay-hint">Your bank will open a secure window to approve the payment. Return here when you have finished.</p></>}
                  {method === "wallet" && <><label>Your wallet<select name="wallet" defaultValue="" required><option value="" disabled>Select your wallet</option>{methods.wallets.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><p className="custom-pay-hint">Your wallet will open a secure window to approve the payment.</p></>}
                  {method === "upi" && (mobile ? <>
                    <fieldset className="custom-pay-apps"><legend>Choose your UPI app</legend>{apps.map(id => <label key={id} className={app === id ? "is-selected" : ""}><input type="radio" name="upiApp" value={id} checked={app === id} onChange={() => { setApp(id); setError(""); }} /><span>{appLabels[id]}</span></label>)}</fieldset>
                    {!apps.length && <p role="status" className="custom-pay-hint">No supported UPI app is available in this browser. Choose another payment method, or open this checkout on a computer to scan a QR code.</p>}
                    <p className="custom-pay-hint">Choose an app you use on this phone. Approve the payment there, then return here. Enter your UPI PIN only in your payment app.</p>
                  </> : <div className="custom-pay-upi"><QrCode size={36} aria-hidden="true" /><h3>Scan with your UPI app</h3><ul className="custom-pay-scan-apps" aria-label="Apps you can scan with"><li>Google Pay</li><li>PhonePe</li><li>Paytm</li><li>Any UPI app</li></ul><p>{embeddedQr ? "Generate a QR code, then scan it with a UPI app on your phone." : "Open a secure Razorpay window and scan the QR code with your UPI app."}</p></div>)}
                </div>
                {error && <p className="custom-pay-error" role="alert">{error}</p>}
                <button type="submit" className="custom-pay-submit" disabled={method === "upi" && mobile && !app}>{method === "upi" && !mobile ? embeddedQr ? "Generate QR code" : "Open UPI QR code" : `Pay ${total}`}<ArrowRight size={18} aria-hidden="true" /></button>
              </>}
            </form>}
            {pending && <div className="custom-pay-status" role="status">
              {qr ? <><h3>Scan to pay {total}</h3><img className="custom-pay-qr" src={qr.image} alt="Scan this QR code with your UPI app to pay for this order" /><p>Approve the payment in your UPI app.</p><span className="custom-pay-expiry">Expires in {Math.floor(Math.max(0, qr.expiresAt - clock) / 60000)}:{String(Math.floor(Math.max(0, qr.expiresAt - clock) / 1000) % 60).padStart(2, "0")}</span></> : <><LoaderCircle className="custom-pay-spinner" aria-hidden="true" /><h3>Complete your payment</h3><p>Follow the steps in your UPI app or bank window, then return here.</p></>}
              <p className="custom-pay-hint">Already paid? Return to the course to check payment status. Do not pay again while confirmation is pending.</p>
            </div>}
            {phase === "uncertain" && <div className="custom-pay-status"><ShieldCheck size={32} aria-hidden="true" /><h3>Let us check your payment</h3><p className="custom-pay-error" role="alert">{error}</p></div>}
            {phase !== "loading" && <button className="custom-pay-return" type="button" onClick={() => onFinish(null)}>{submitted.current ? "Return and check payment status" : "Back to course"}</button>}
            <p className="custom-pay-security"><LockKeyhole size={15} aria-hidden="true" />Payments processed by Razorpay</p>
          </section>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
