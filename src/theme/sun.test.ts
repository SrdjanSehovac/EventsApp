import { isDaytime, sunTimes } from './sun';

function check(name: string, ok: boolean, detail = '') {
  if (!ok) throw new Error(`${name} ${detail}`);
  console.log(`ok  ${name}`);
}

const toronto = { lat: 43.65, lng: -79.38 };
// Oct 13 2026 Toronto: sunrise ~7:24, sunset ~18:41 local (UTC-4).
const t = sunTimes(new Date(2026, 9, 13, 12), toronto.lat, toronto.lng)!;
const riseLocalMin = (t.sunrise.getUTCHours() - 4) * 60 + t.sunrise.getUTCMinutes();
const setLocalMin = (t.sunset.getUTCHours() - 4) * 60 + t.sunset.getUTCMinutes();
check('Toronto sunrise near 7:24', Math.abs(riseLocalMin - (7 * 60 + 24)) <= 5, String(riseLocalMin));
check('Toronto sunset near 18:41', Math.abs(setLocalMin - (18 * 60 + 41)) <= 5, String(setLocalMin));
check('noon is day', isDaytime(new Date(Date.UTC(2026, 9, 13, 16)), toronto));
check('8 PM is night', !isDaytime(new Date(Date.UTC(2026, 9, 14, 0)), toronto));
check('fallback 6 AM is night', !isDaytime(new Date(2026, 9, 13, 6), null));
check('fallback 7 AM is day', isDaytime(new Date(2026, 9, 13, 7), null));
check('fallback 7 PM is night', !isDaytime(new Date(2026, 9, 13, 19), null));
check('polar night falls back', sunTimes(new Date(2026, 11, 21), 80, 0) === null);
