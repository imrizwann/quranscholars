import { openRazorpayCheckout } from "./razorpay-checkout.js";

export async function openCourseCheckout(input) {
  if (import.meta.env?.VITE_PAYMENT_CHECKOUT !== "custom") return openRazorpayCheckout(input);
  const { openCustomCheckout } = await import("./custom/open-custom-checkout.jsx");
  return openCustomCheckout(input);
}
