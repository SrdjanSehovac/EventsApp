/** Fallback when the API omits ends_at (matches server DEFAULT_DURATION). */
const DEFAULT_LIVE_MS = 2 * 60 * 60 * 1000;

export function isEventLive(
  pin: { starts_at?: string | null; ends_at?: string | null },
  nowMs: number = Date.now(),
): boolean {
  if (!pin.starts_at) return false;
  const start = Date.parse(pin.starts_at);
  if (Number.isNaN(start) || start > nowMs) return false;

  const end = pin.ends_at
    ? Date.parse(pin.ends_at)
    : start + DEFAULT_LIVE_MS;
  if (Number.isNaN(end)) return false;

  return end > nowMs;
}
