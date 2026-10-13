/**
 * Sunrise and sunset for a date and place (NOAA approximation, ±2 min).
 * Returns null for polar day/night, so callers fall back to fixed hours.
 */
const RAD = Math.PI / 180;

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((now - start) / 86_400_000);
}

/** UTC minutes after midnight for sunrise (rising) or sunset. */
function sunEventUtcMinutes(date: Date, lat: number, lng: number, rising: boolean): number | null {
  const n = dayOfYear(date);
  const gamma = ((2 * Math.PI) / 365) * (n - 1);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const cosHa =
    Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) -
    Math.tan(lat * RAD) * Math.tan(decl);
  if (cosHa < -1 || cosHa > 1) return null;
  const ha = Math.acos(cosHa) / RAD;
  return 720 - 4 * (lng + (rising ? ha : -ha)) - eqTime;
}

export function sunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } | null {
  const rise = sunEventUtcMinutes(date, lat, lng, true);
  const set = sunEventUtcMinutes(date, lat, lng, false);
  if (rise == null || set == null) return null;
  const base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return {
    sunrise: new Date(base + rise * 60_000),
    sunset: new Date(base + set * 60_000),
  };
}

export const FALLBACK_DAY_START_HOUR = 7;
export const FALLBACK_DAY_END_HOUR = 19;

/** Daytime test for Auto appearance: sun times when we know where, else 7:00–19:00. */
export function isDaytime(now: Date, place?: { lat: number; lng: number } | null): boolean {
  if (place) {
    const times = sunTimes(now, place.lat, place.lng);
    if (times) return now >= times.sunrise && now < times.sunset;
  }
  const h = now.getHours();
  return h >= FALLBACK_DAY_START_HOUR && h < FALLBACK_DAY_END_HOUR;
}
