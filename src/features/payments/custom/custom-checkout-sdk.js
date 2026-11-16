const SDK_URL = "https://checkout.razorpay.com/v1/razorpay.js";
let loading;

export function loadCustomRazorpay() {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    const fail = () => {
      clearTimeout(timer);
      script.onload = script.onerror = null;
      script.remove();
      loading = undefined;
      reject(new Error("Secure checkout could not load. Please return to the course and try again."));
    };
    const timer = setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => {
      if (typeof window.Razorpay !== "function") return fail();
      clearTimeout(timer);
      script.onload = script.onerror = null;
      // Keep this constructor separate from Standard Checkout's global.
      resolve(window.Razorpay);
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function validateCustomOrder(payment, { production = false, liveEnabled = false } = {}) {
  const checkout = payment?.checkout;
  if (payment?.state !== "pending" || checkout?.provider !== "razorpay" ||
      !/^order_[A-Za-z0-9]+$/.test(checkout.orderId || "") ||
      !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(checkout.publicKey || "") ||
      !Number.isSafeInteger(payment.amountMinor) || payment.amountMinor <= 0 ||
      !/^[A-Z]{3}$/.test(payment.currency || "")) throw new Error("This checkout is unavailable. Return to the course and check payment status.");
  const live = checkout.publicKey.startsWith("rzp_live_");
  if ((production && !live) || (live && !liveEnabled)) throw new Error("Custom checkout is not enabled for this payment environment. Please use the existing checkout.");
}

export const walletLabels = { payzapp: "PayZapp", olamoney: "Ola Money", phonepe: "PhonePe Wallet", airtelmoney: "Airtel Money", mobikwik: "MobiKwik", jiomoney: "JioMoney", amazonpay: "Amazon Pay", bajajpay: "Bajaj Pay", paypal: "PayPal", phonepeswitch: "PhonePe Switch" };

export function enabledMethods(methods, currency) {
  return {
    card: methods?.card === true,
    upi: currency === "INR" && methods?.upi === true,
    wallets: Object.keys(walletLabels).filter(code => methods?.wallet?.[code] === true).map(code => [code, walletLabels[code]]),
    banks: Object.entries(methods?.netbanking || {}).filter(([code, name]) => /^[A-Z0-9_]{2,20}$/.test(code) && typeof name === "string" && name.length > 0)
      .sort((a, b) => a[1].localeCompare(b[1])),
  };
}

export const appLabels = { gpay: "Google Pay", phonepe: "PhonePe", paytm: "Paytm", bhim: "BHIM", cred: "CRED", any: "Other UPI app", mobikwik: "MobiKwik", super_money: "super.money", navi: "Navi", payzapp: "PayZapp", icici: "iMobile", moneyview: "Moneyview", popclubapp: "POP" };
export const supportedApps = apps => Array.isArray(apps) ? [...new Set(apps)].filter(app => Object.hasOwn(appLabels, app)) : [];

export function paymentDetails(payment, method, fields, methods, now = new Date()) {
  const email = String(fields.email || "").trim();
  const contact = String(fields.contact || "").replace(/[\s()-]/g, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid email address.");
  if (!/^\+?[0-9]{10,15}$/.test(contact)) throw new Error("Enter a valid mobile number, including the country code if needed.");
  const data = { amount: payment.amountMinor, currency: payment.currency, order_id: payment.checkout.orderId, email, contact, method };
  if (method === "card" && methods.card) {
    const number = String(fields.number || "").replace(/\s/g, "");
    const cvv = String(fields.cvv || "");
    const name = String(fields.name || "").trim();
    const expiry = String(fields.expiry || "").match(/^(\d{2})\s*\/\s*(\d{2}|\d{4})$/);
    const month = Number(expiry?.[1]), year = expiry ? Number(expiry[2].length === 2 ? `20${expiry[2]}` : expiry[2]) : 0;
    let sum = 0;
    for (let index = number.length - 1, alternate = false; index >= 0; index--, alternate = !alternate) {
      let digit = Number(number[index]);
      if (alternate) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
    }
    if (!/^\d{12,19}$/.test(number) || /^0+$/.test(number) || sum % 10 !== 0) throw new Error("Check your card number.");
    if (!name || name.length > 100) throw new Error("Enter the name on your card.");
    if (!expiry || month < 1 || month > 12 || year < now.getFullYear() || year > now.getFullYear() + 30 || (year === now.getFullYear() && month < now.getMonth() + 1)) throw new Error("Enter a valid card expiry date as MM/YY.");
    if (!/^\d{3,4}$/.test(cvv)) throw new Error("Enter the 3 or 4 digit security code.");
    return { ...data, "card[number]": number, "card[name]": name, "card[cvv]": cvv, "card[expiry_month]": String(month).padStart(2, "0"), "card[expiry_year]": String(year).slice(-2) };
  }
  if (method === "netbanking" && methods.banks.some(([code]) => code === fields.bank)) return { ...data, bank: fields.bank };
  if (method === "wallet" && methods.wallets?.some(([code]) => code === fields.wallet)) return { ...data, wallet: fields.wallet };
  if (method === "upi" && methods.upi) return data;
  throw new Error("Choose an available payment method.");
}

export function verifiedCallback(response, payment) {
  if (response?.razorpay_order_id !== payment.checkout.orderId || !/^pay_[A-Za-z0-9]+$/.test(response?.razorpay_payment_id || "") || !/^[a-f0-9]{64}$/i.test(response?.razorpay_signature || "")) return null;
  // This is shape validation only. The existing backend performs the real verification.
  return { paymentId: response.razorpay_payment_id, signature: response.razorpay_signature };
}

export function validQr(event, now = Date.now()) {
  if (event?.status !== "created" || !Number.isSafeInteger(event.expires_on) || event.expires_on <= now || event.expires_on > now + 11 * 60 * 1000 || typeof event.qr_url !== "string" || event.qr_url.length > 4096) return null;
  try {
    const url = new URL(event.qr_url);
    if (url.protocol !== "upi:" || url.hostname !== "pay" || !url.searchParams.get("pa") || url.username || url.password) return null;
    return { value: event.qr_url, expiresAt: event.expires_on };
  } catch { return null; }
}

export function createCustomSession(Razorpay, payment, { ready, success, error, qr }) {
  let active = true, submitting = false;
  const instance = new Razorpay({ key: payment.checkout.publicKey, redirect: false, image: new URL("/web-app-manifest-192x192.png", window.location.origin).href });
  const timer = setTimeout(() => { if (active) error("Payment methods could not load. Return to the course and try again."); }, 15000);
  instance.once("ready", response => {
    clearTimeout(timer);
    if (active) ready(enabledMethods(response?.methods || instance.methods, payment.currency));
  });
  instance.on("payment.success", response => { if (active && submitting) { submitting = false; success(verifiedCallback(response, payment)); } });
  instance.on("payment.error", () => { if (active && submitting) { submitting = false; error("Payment was not confirmed. Return to the course to check its status before trying again."); } });
  instance.on("payment.upi.qr", event => { if (active && submitting) qr(validQr(event)); });
  return {
    apps: () => Promise.resolve().then(() => instance.getSupportedUpiIntentApps()).then(supportedApps).catch(() => []),
    submit(data, options) {
      if (!active || submitting) return false;
      submitting = true;
      // Must stay synchronous in the user's click/submit event to allow bank popups and UPI apps.
      try { instance.createPayment(data, options); }
      catch { submitting = false; error("Payment could not be started. Return to the course to check its status."); }
      return true;
    },
    dispose() {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      if (submitting) { try { instance.emit("payment.cancel"); } catch { /* Recovery is handled by the existing server reconciliation. */ } }
    },
  };
}
