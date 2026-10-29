import { userFacingError } from "../../lib/user-messages.js";

export function coursePrice(originalInput, saleInput = "") {
  const original = Number(originalInput);
  const saleText = String(saleInput ?? "").trim();
  const sale = saleText === "" ? undefined : Number(saleText);
  if (!Number.isFinite(original) || original <= 0) throw userFacingError("Enter an original price greater than zero.");
  if (sale !== undefined && (!Number.isFinite(sale) || sale < 0 || sale > original)) throw userFacingError("Sale price must be between zero and the original price.");
  return { original, ...(sale !== undefined ? { sale } : {}) };
}
