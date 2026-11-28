export const reviewDate = value => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Not reviewed";

export const yearsLabel = years => `${years} ${Number(years) === 1 ? "year" : "years"}`;

/** How long ago something happened, for "Waiting 3 days" style labels. */
export function reviewAge(value, now = Date.now()) {
  const ms = now - new Date(value).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const hours = Math.floor(ms / 3600000), days = Math.floor(ms / 86400000);
  const label = days >= 1 ? `${days} ${days === 1 ? "day" : "days"}` : hours >= 1 ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "under an hour";
  return { days, label };
}
