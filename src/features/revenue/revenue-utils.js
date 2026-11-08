export { formatMoney as moneyText } from "../../lib/money.js";
export function moneyInput(value, exponent = 2) {
  if (!Number.isSafeInteger(value) || value < 0) return "";
  const scale = 10n ** BigInt(exponent), amount = BigInt(value);
  return `${amount / scale}${exponent ? `.${String(amount % scale).padStart(exponent, "0")}` : ""}`;
}
export function parseMoney(value, exponent = 2) {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 3) throw new Error("Unsupported currency precision.");
  const input = String(value).trim();
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${Math.max(1, exponent)}})?$`).test(input) || (exponent === 0 && input.includes("."))) throw new Error(`Enter an amount with up to ${exponent} decimal places.`);
  const [whole, fraction = ""] = input.split(".");
  const minor = BigInt(whole) * 10n ** BigInt(exponent) + BigInt(fraction.padEnd(exponent, "0") || "0");
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("This amount is too large.");
  return Number(minor);
}
export const businessDate = (value = Date.now()) => new Date(+new Date(value) + 330 * 60_000).toISOString().slice(0, 10);
export const currentPeriod = () => businessDate().slice(0, 7);
export function salesMonthOptions(now = Date.now()) {
  const [year, month] = businessDate(now).slice(0, 7).split("-").map(Number);
  return [{ value: "all", label: "All months" }, ...Array.from({ length: 36 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1));
    return { value: date.toISOString().slice(0, 7), label: date.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" }) };
  })];
}
export const suggestedSalesPeriod = () => {
  const local = new Date(Date.now() - 30 * 86400_000 + 330 * 60_000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
};
export const dateText = value => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Not confirmed";
export const localDateTime = value => {
  const date = new Date(value || Date.now());
  return new Date(+date - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
};
export const payoutActions = status => ({ pending: ["approve", "cancel"], approved: ["start", "cancel"], processing: ["paid", "fail"] }[status] || []);
