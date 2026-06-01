/** Format string YYYY-MM-DD tanpa efek timezone (hindari mundur 1 hari) */
export function formatDateId(isoDate) {
  if (!isoDate) return "-";
  const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(isoDate);
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month, day)).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
