/**
 * Reservation ID builder
 * Format: [memberId]-[last6VIN]-[mmddyyyy]
 * Example: "C1234-XY7890-05282026"
 *
 * All three inputs are required. Returns an empty string if any are missing.
 */
export function buildReservationId(
  memberId: string,
  vin: string,
  startDate: string  // expects YYYY-MM-DD (HTML date input value)
): string {
  if (!memberId || !vin || !startDate) return "";

  const last6 = vin.replace(/\s/g, "").slice(-6).toUpperCase();

  // Parse YYYY-MM-DD → mmddyyyy
  const parts = startDate.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  const datePart = `${mm}${dd}${yyyy}`;

  return `${memberId.trim()}-${last6}-${datePart}`;
}
