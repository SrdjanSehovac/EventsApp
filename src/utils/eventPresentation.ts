import type { EventDetail } from '../types/events';
import { sanitizePublicText } from './outboundLinks';

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

type ClockParts = {
  weekday: string;
  month: string;
  day: string;
  year: string;
  hour: string;
  minute: string;
  dayPeriod: string;
};

function clockParts(
  value: string,
  timeZone?: string | null,
  dateOnly = false,
): ClockParts | null {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const date = dateOnlyMatch
    ? new Date(Date.UTC(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]), 12))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const zone = !dateOnlyMatch && isValidTimeZone(timeZone) ? timeZone : undefined;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: dateOnlyMatch ? 'UTC' : zone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(dateOnly ? {} : { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' as const }),
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const period = read('dayPeriod').toUpperCase();
  return {
    weekday: read('weekday').replace(/\.$/, ''),
    month: read('month'),
    day: read('day'),
    year: read('year'),
    hour: read('hour'),
    minute: read('minute'),
    dayPeriod: period === 'PM' ? 'PM' : 'AM',
  };
}

function dateLabel(parts: ClockParts): string {
  return `${parts.weekday}, ${parts.month} ${parts.day}`;
}

function clockLabel(parts: ClockParts, withPeriod: boolean): string {
  const clock = parts.minute && parts.minute !== '00'
    ? `${parts.hour}:${parts.minute}`
    : parts.hour;
  return withPeriod ? `${clock} ${parts.dayPeriod}` : clock;
}

function sameDay(a: ClockParts, b: ClockParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** One line: `Wed, Oct 14 · 7:30–9:30 PM`. */
export function formatStartEnd(
  startsAt?: string | null,
  endsAt?: string | null,
  timeZone?: string | null,
): string | null {
  const start = startsAt ? clockParts(startsAt, timeZone) : null;
  if (!start) return null;
  const end = endsAt ? clockParts(endsAt, timeZone) : null;
  if (!end) return `${dateLabel(start)} · ${clockLabel(start, true)}`;
  if (sameDay(start, end)) {
    const sharedPeriod = start.dayPeriod === end.dayPeriod;
    return `${dateLabel(start)} · ${clockLabel(start, !sharedPeriod)}–${clockLabel(end, true)}`;
  }
  return `${dateLabel(start)} · ${clockLabel(start, true)} – ${dateLabel(end)} · ${clockLabel(end, true)}`;
}

function formatDateOnly(value?: string | null, timeZone?: string | null): string | null {
  if (!value) return null;
  const parts = clockParts(value, timeZone, true);
  return parts ? dateLabel(parts) : null;
}

function formatClockOnly(value?: string | null, timeZone?: string | null): string | null {
  if (!value) return null;
  const clock = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (clock) {
    const hours = Number(clock[1]);
    const minutes = clock[2];
    if (!Number.isFinite(hours)) return null;
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const label = minutes === '00' ? String(hour12) : `${hour12}:${minutes}`;
    return `${label} ${period}`;
  }
  const parts = clockParts(value, timeZone);
  return parts ? clockLabel(parts, true) : null;
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
    const dailyStart = formatClockOnly(detail.daily_start_time, detail.timezone);
    const dailyEnd = formatClockOnly(detail.daily_end_time, detail.timezone);
    const span = start && end ? `${start} – ${end}` : start ? `From ${start}` : end ? `Until ${end}` : null;
    const hours =
      dailyStart && dailyEnd ? `${dailyStart}–${dailyEnd}` : dailyStart ? `From ${dailyStart}` : null;
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
