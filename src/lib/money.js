// Keep minor units exact, including amounts too large for decimal division.
export function formatMoney(value, currency = "INR", exponent = 2) {
  if (!Number.isSafeInteger(value)) return "Awaiting review";
  const scale = 10n ** BigInt(exponent), absolute = BigInt(value < 0 ? -value : value);
  const whole = Number(absolute / scale) * (value < 0 ? -1 : 1);
  const fraction = String(absolute % scale).padStart(exponent, "0");
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: exponent, maximumFractionDigits: exponent }).formatToParts(whole).map(part => part.type === "fraction" ? fraction : part.value).join("");
}
