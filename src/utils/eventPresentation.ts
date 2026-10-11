import type { EventDetail } from '../types/events';
import { isBlockedSourceLabel, sanitizePublicText } from './outboundLinks';

type ScheduleInput = Pick<
  EventDetail,
  | 'schedule_type'
  | 'timezone'
  | 'starts_at'
  | 'ends_at'
  | 'range_start_date'
  | 'range_end_date'
  | 'daily_start_time'
  | 'daily_end_time'
>;

type PriceInput = Pick<
  EventDetail,
  | 'is_free'
  | 'price_min_cad'
  | 'price_max_cad'
  | 'price_notes'
  | 'ticketing'
  | 'requires_rsvp'
>;

type PlaceInput = {
  venue_name?: string | null;
  address_line?: string | null;
  venue?: {
    name?: string | null;
    address_line?: string | null;
    city?: string | null;
    neighbourhood?: string | null;
  } | null;
  raw_venue_name?: string | null;
  raw_venue_address?: string | null;
  neighbourhood?: string | null;
  city?: string | null;
};

const PROVINCE_CODE: Record<string, string> = {
  ab: 'AB',
  alberta: 'AB',
  bc: 'BC',
  'british columbia': 'BC',
  mb: 'MB',
  manitoba: 'MB',
  nb: 'NB',
  'new brunswick': 'NB',
  nl: 'NL',
  newfoundland: 'NL',
  'newfoundland and labrador': 'NL',
  ns: 'NS',
  'nova scotia': 'NS',
  nt: 'NT',
  'northwest territories': 'NT',
  nu: 'NU',
  nunavut: 'NU',
  on: 'ON',
  ontario: 'ON',
  pe: 'PE',
  pei: 'PE',
  'prince edward island': 'PE',
  qc: 'QC',
  quebec: 'QC',
  québec: 'QC',
  sk: 'SK',
  saskatchewan: 'SK',
  yt: 'YT',
  yukon: 'YT',
};

const COUNTRY = new Set([
  'canada',
  'ca',
  'united states',
  'united states of america',
  'usa',
  'us',
]);

const POSTAL = /\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b/i;

function toNumber(value?: number | string | null): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCad(value: number): string {
  const whole = Math.abs(value - Math.round(value)) < 0.001;
  const text = value.toLocaleString('en-CA', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
  return `$${text}`;
}

/** One price chip. Free only when the event is free and nothing costs more than zero. */
export function formatDetailPrice(detail: PriceInput): string | null {
  const amounts = [toNumber(detail.price_min_cad), toNumber(detail.price_max_cad)].filter(
    (value): value is number => value != null && value > 0,
  );
  if (amounts.length) {
    const low = Math.min(...amounts);
    const high = Math.max(...amounts);
    return high > low ? `From ${formatCad(low)}` : formatCad(low);
  }
  if (detail.is_free === true) return 'Free';
  if (detail.ticketing === 'ticketed') return 'Ticketed';
  if (detail.ticketing === 'donation') return 'Donation';
  if (detail.ticketing === 'door') return 'Pay at door';
  if (detail.ticketing === 'rsvp' || detail.requires_rsvp) return 'RSVP';
  const notes = detail.price_notes?.trim() ?? '';
  if (notes && notes.toLowerCase() !== 'free') return notes;
  return null;
}

/** `Hosted by Name`, or null when the server sent no organizer. */
export function hostedByLine(name?: string | null): string | null {
  const clean = sanitizePublicText(name);
  if (!clean || isBlockedSourceLabel(clean)) return null;
  return `Hosted by ${clean}`;
}

export function formatActionLabel(label: string, price?: string | null): string {
  if (!price || price === 'Free') return label;
  if (label !== 'Get tickets' && label !== 'Register') return label;
  return `${label} · ${price}`;
}

export function isValidTimeZone(timeZone?: string | null): timeZone is string {
  if (!timeZone) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

type Wall = {
  weekday: string;
  month: string;
  day: string;
  year: string;
  dateOnly: boolean;
  hour24: number | null;
  minute: number | null;
};

type ClockText = {
  period: 'AM' | 'PM';
  /** `7` or `7:30`, with `:00` omitted. */
  compact: string;
  /** `7 AM` or `7:30 PM`. */
  withPeriod: string;
  /** `7:00 AM` or `7:30 PM`. Minutes always shown. */
  full: string;
};

/**
 * Read a wall clock from `Intl` `format()`, not `formatToParts`.
 * Hermes can return date parts and then omit `hour` / `dayPeriod` when
 * `hourCycle: 'h12'` is set. Filling a missing period with "AM" produced
 * `Sun, Oct 11 · – AM`.
 * `hour12: false` may also emit `24:00` at midnight; that is 12:00 AM.
 */
function parseHourMinute(formatted: string): { hour24: number; minute: number } | null {
  const text = formatted.replace(/[\u202f\u00a0\u2009]/g, ' ').trim();
  const withPeriod = /(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap])\.?\s*m\.?/i.exec(text);
  const bare = /(\d{1,2}):(\d{2})(?::\d{2})?/.exec(text);
  const match = withPeriod ?? bare;
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? '0');
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return null;
  }
  const period = withPeriod?.[3]?.toLowerCase();
  if (!period && hour === 24) hour = 0;
  if (period === 'a') {
    if (hour === 12 || hour === 24) hour = 0;
    if (hour > 12) return null;
  } else if (period === 'p') {
    if (hour === 12) hour = 12;
    else if (hour < 12) hour += 12;
    else return null;
  }
  if (hour < 0 || hour > 23) return null;
  return { hour24: hour, minute };
}

function formatPart(
  date: Date,
  timeZone: string | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone })
    .format(date)
    .replace(/\.$/, '')
    .trim();
}

function wallClock(value: string, timeZone?: string | null): Wall | null {
  const trimmed = value.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const date = dateOnlyMatch
    ? new Date(
        Date.UTC(
          Number(dateOnlyMatch[1]),
          Number(dateOnlyMatch[2]) - 1,
          Number(dateOnlyMatch[3]),
          12,
        ),
      )
    : new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  const zone = dateOnlyMatch
    ? 'UTC'
    : isValidTimeZone(timeZone)
      ? timeZone
      : undefined;
  const weekday = formatPart(date, zone, { weekday: 'short' });
  const month = formatPart(date, zone, { month: 'short' });
  const day = formatPart(date, zone, { day: 'numeric' });
  const year = formatPart(date, zone, { year: 'numeric' });
  if (!weekday || !month || !day || !year) return null;
  if (dateOnlyMatch) {
    return { weekday, month, day, year, dateOnly: true, hour24: null, minute: null };
  }
  const timeText = formatPart(date, zone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const time = parseHourMinute(timeText);
  return {
    weekday,
    month,
    day,
    year,
    dateOnly: false,
    hour24: time?.hour24 ?? null,
    minute: time?.minute ?? null,
  };
}

function dateLabel(parts: Wall): string {
  return `${parts.weekday}, ${parts.month} ${parts.day}`;
}

function sameDay(a: Wall, b: Wall): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function clockText(hour24: number, minute: number): ClockText | null {
  if (!Number.isInteger(hour24) || !Number.isInteger(minute)) return null;
  if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) return null;
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const minutes = String(minute).padStart(2, '0');
  const compact = minute === 0 ? String(hour12) : `${hour12}:${minutes}`;
  return {
    period,
    compact,
    withPeriod: minute === 0 ? `${hour12} ${period}` : `${hour12}:${minutes} ${period}`,
    full: `${hour12}:${minutes} ${period}`,
  };
}

function clockFromWall(parts: Wall): ClockText | null {
  if (parts.dateOnly || parts.hour24 == null || parts.minute == null) return null;
  return clockText(parts.hour24, parts.minute);
}

/** Same meridiem stays compact (`7:30–9:30 PM`). A change of meridiem spells both (`9:00 AM – 12:00 PM`). */
function joinClocks(start: ClockText, end: ClockText): string {
  if (start.period === end.period) return `${start.compact}–${end.withPeriod}`;
  return `${start.full} – ${end.full}`;
}

function withClock(date: string, clock: ClockText | null): string {
  return clock ? `${date} · ${clock.withPeriod}` : date;
}

/** One line: `Wed, Oct 14 · 7:30–9:30 PM`. Never a bare dash or an empty time. */
export function formatStartEnd(
  startsAt?: string | null,
  endsAt?: string | null,
  timeZone?: string | null,
): string | null {
  const start = startsAt ? wallClock(startsAt, timeZone) : null;
  if (!start) return null;
  const end = endsAt ? wallClock(endsAt, timeZone) : null;
  if (start.dateOnly) {
    if (end && !sameDay(start, end)) return `${dateLabel(start)} – ${dateLabel(end)}`;
    return dateLabel(start);
  }
  const startClock = clockFromWall(start);
  const endClock = end && !end.dateOnly ? clockFromWall(end) : null;
  if (!end || !endClock) return withClock(dateLabel(start), startClock);
  if (!startClock) return withClock(dateLabel(end), endClock);
  if (!sameDay(start, end)) {
    return `${withClock(dateLabel(start), startClock)} – ${withClock(dateLabel(end), endClock)}`;
  }
  return `${dateLabel(start)} · ${joinClocks(startClock, endClock)}`;
}

function formatDateOnly(value?: string | null, timeZone?: string | null): string | null {
  if (!value) return null;
  const parts = wallClock(value, timeZone);
  return parts ? dateLabel(parts) : null;
}

function clockFromValue(value: string, timeZone?: string | null): ClockText | null {
  const simple = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (simple) {
    const hours = Number(simple[1]);
    const minutes = Number(simple[2]);
    if (hours > 23) return null;
    return clockText(hours, minutes);
  }
  const parts = wallClock(value, timeZone);
  return parts ? clockFromWall(parts) : null;
}

/**
 * A single human schedule line. ISO strings and `raw_schedule_text` are never shown.
 */
export function formatScheduleLines(detail: ScheduleInput): string[] {
  if (
    detail.schedule_type === 'date_range' &&
    (detail.range_start_date || detail.range_end_date)
  ) {
    const start = formatDateOnly(detail.range_start_date, detail.timezone);
    const end = formatDateOnly(detail.range_end_date, detail.timezone);
    const dailyStart = detail.daily_start_time
      ? clockFromValue(detail.daily_start_time, detail.timezone)
      : null;
    const dailyEnd = detail.daily_end_time
      ? clockFromValue(detail.daily_end_time, detail.timezone)
      : null;
    const span =
      start && end && start !== end
        ? `${start} – ${end}`
        : start
          ? start
          : end
            ? end
            : null;
    const hours =
      dailyStart && dailyEnd
        ? joinClocks(dailyStart, dailyEnd)
        : dailyStart
          ? dailyStart.withPeriod
          : null;
    if (span && hours) return [`${span} · ${hours}`];
    if (span) return [span];
  }

  const line = formatStartEnd(detail.starts_at, detail.ends_at, detail.timezone);
  return [line ?? 'Schedule TBD'];
}

export function formatOccurrenceLine(
  occurrence: { starts_at: string; ends_at: string },
  timeZone?: string | null,
): string {
  return formatStartEnd(occurrence.starts_at, occurrence.ends_at, timeZone) ?? 'Schedule TBD';
}

function words(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function stripLeadingTitle(body: string, title?: string | null): string {
  const target = words(title ?? '');
  if (!target) return body.trim();
  const bodyWords = words(body);
  if (!bodyWords.startsWith(target) || bodyWords === target) return body.trim();

  let acc = '';
  for (let i = 0; i < body.length; i += 1) {
    acc = words(body.slice(0, i + 1));
    if (acc === target) {
      let cut = i + 1;
      while (cut < body.length && /[\s:–—\-|·,.]/.test(body[cut])) cut += 1;
      const rest = body.slice(cut).trim();
      return rest || body.trim();
    }
    if (acc.length > target.length) break;
  }
  return body.trim();
}

function dedupeParagraphs(body: string): string {
  const blocks = body
    .split(/\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
  const kept: string[] = [];
  const seen: string[] = [];
  for (const block of blocks) {
    const key = words(block);
    if (!key) continue;
    const duplicate = seen.some(
      (previous) => previous === key || previous.includes(key),
    );
    if (duplicate) continue;
    const shorter = seen.findIndex((previous) => key.includes(previous));
    if (shorter >= 0) {
      seen.splice(shorter, 1, key);
      kept.splice(shorter, 1, block);
      continue;
    }
    seen.push(key);
    kept.push(block);
  }
  return kept.join('\n\n');
}

function collapseExactRepeat(body: string): string {
  const tokens = words(body).split(' ').filter(Boolean);
  if (tokens.length < 8 || tokens.length % 2 !== 0) return body;
  const half = tokens.length / 2;
  const first = tokens.slice(0, half).join(' ');
  const second = tokens.slice(half).join(' ');
  if (first !== second) return body;
  let acc = '';
  for (let i = 0; i < body.length; i += 1) {
    acc = words(body.slice(0, i + 1));
    if (acc === first) {
      let cut = i + 1;
      while (cut < body.length && /[.,;:!?]/.test(body[cut])) cut += 1;
      return body.slice(0, cut).trim();
    }
  }
  return body;
}

/** One about body. Description wins; a repeated title or summary is removed. */
export function formatAboutBody(input: {
  title?: string | null;
  description?: string | null;
  summary?: string | null;
  bio?: string | null;
}): string | null {
  const raw = input.description || input.summary || input.bio;
  if (!raw?.trim()) return null;
  const blocks = raw
    .split(/\n+/)
    .map((block) => sanitizePublicText(block))
    .filter((block): block is string => Boolean(block));
  const body = collapseExactRepeat(
    stripLeadingTitle(dedupeParagraphs(blocks.join('\n\n')), input.title),
  );
  return body.trim() || null;
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const next = value?.trim();
    if (next) return next;
  }
  return '';
}

function looksLikeStreet(value: string): boolean {
  return /^\d+[a-zA-Z]?(?:-\d+[a-zA-Z]?)?\s+\S/.test(value.trim());
}

type AddressPiece = { keys: string[]; text: string };

function pieceFor(segment: string): AddressPiece | null {
  const trimmed = segment.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase().replace(/\./g, '');
  if (COUNTRY.has(lower)) return { keys: ['country'], text: '' };
  const province = PROVINCE_CODE[lower];
  if (province) return { keys: [`region:${province}`], text: province };

  const postalMatch = trimmed.toUpperCase().match(POSTAL);
  const postal = postalMatch ? `${postalMatch[1]} ${postalMatch[2]}` : null;
  const withoutPostal = postalMatch
    ? trimmed.replace(new RegExp(postalMatch[0], 'i'), '').replace(/[,\s]+$/g, '').trim()
    : trimmed;
  const region = PROVINCE_CODE[withoutPostal.toLowerCase().replace(/\./g, '')];
  if (region && postal) {
    return {
      keys: [`region:${region}`, `postal:${postal.replace(/\s/g, '')}`],
      text: `${region} ${postal}`,
    };
  }
  if (postal && !withoutPostal) {
    return { keys: [`postal:${postal.replace(/\s/g, '')}`], text: postal };
  }
  return { keys: [`text:${lower}`], text: trimmed };
}

/** Collapse repeated city, province, and country tokens into one address line. */
export function cleanAddressLine(value: string): string {
  const segments = value
    .split(/\s*[·|]\s*|\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const pieces: AddressPiece[] = [];
  const seen = new Set<string>();

  for (const segment of segments) {
    const next = pieceFor(segment);
    if (!next) continue;
    if (!next.text) {
      next.keys.forEach((key) => seen.add(key));
      continue;
    }
    const regionKey = next.keys.find((key) => key.startsWith('region:'));
    const postalKey = next.keys.find((key) => key.startsWith('postal:'));
    if (regionKey && postalKey && seen.has(regionKey) && !seen.has(postalKey)) {
      const bare = pieces.find(
        (piece) => piece.keys.includes(regionKey) && !piece.keys.some((key) => key.startsWith('postal:')),
      );
      if (bare) {
        bare.text = next.text;
        bare.keys.push(postalKey);
        seen.add(postalKey);
        continue;
      }
    }
    if (next.keys.every((key) => seen.has(key))) continue;
    pieces.push(next);
    next.keys.forEach((key) => seen.add(key));
  }

  return pieces.map((piece) => piece.text).filter(Boolean).join(', ');
}

function samePlace(a: string, b: string): boolean {
  return words(a) === words(b);
}

export function formatPlaceLines(detail: PlaceInput): {
  name: string | null;
  address: string | null;
} {
  const nameSource = firstText(detail.venue_name, detail.venue?.name, detail.raw_venue_name);
  const addressSource = firstText(
    detail.address_line,
    detail.venue?.address_line,
    detail.raw_venue_address,
  );
  let name = nameSource ? cleanAddressLine(nameSource) : '';
  let address = addressSource ? cleanAddressLine(addressSource) : '';

  if (name && looksLikeStreet(name)) {
    if (!address) address = name;
    name = '';
  }
  if (name && address && (samePlace(name, address) || words(address).includes(words(name)))) {
    if (words(address).includes(words(name)) && !samePlace(name, address) && !looksLikeStreet(name)) {
      // A real venue name that also appears in the address stays with the address line.
    } else if (samePlace(name, address)) {
      address = '';
    }
  }
  if (name && address && words(name).includes(words(address))) address = '';

  const city = firstText(detail.venue?.city, detail.city);
  if (address && city && !words(address).includes(words(city))) {
    address = `${address}, ${city}`;
  }

  return {
    name: name || null,
    address: address || null,
  };
}

/** Schema.org types such as Event and SportsEvent are not attendee-facing tags. */
export function isSchemaOrgType(label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  if (trimmed === 'Event') return true;
  if (/[a-z][A-Z]/.test(trimmed)) return true;
  return /^[A-Z][A-Za-z0-9]*Event$/.test(trimmed);
}
