import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

import type {
  EventDetail,
  EventListItem,
  EventMapPin,
} from '../types/events';

export function eventDetailHref(eventId: string) {
  return {
    pathname: '/event/[id]' as const,
    params: { id: eventId },
  };
}

export function pinToListItem(pin: EventMapPin): EventListItem {
  return {
    event_id: pin.event_id,
    title: pin.title,
    source: '',
    source_url: '',
    status: 'active',
    schedule_type: 'one_shot',
    starts_at: pin.starts_at,
    ends_at: pin.ends_at,
    is_free: pin.is_free,
    neighbourhood: pin.neighbourhood,
    city: pin.city,
    primary_category: pin.primary_category,
    image_url: pin.image_url,
    latitude: pin.latitude,
    longitude: pin.longitude,
    distance_km: pin.distance_m != null ? pin.distance_m / 1000 : null,
  };
}

export function detailToListItem(detail: EventDetail): EventListItem {
  return {
    event_id: detail.event_id,
    title: detail.title,
    summary: detail.summary,
    source: detail.source,
    source_url: detail.source_url,
    status: detail.status,
    schedule_type: detail.schedule_type,
    starts_at: detail.starts_at,
    ends_at: detail.ends_at,
    is_free: detail.is_free,
    neighbourhood: detail.neighbourhood ?? detail.venue?.neighbourhood,
    city: detail.venue?.city ?? null,
    primary_category:
      detail.categories.find((c) => c.is_primary) ??
      detail.categories[0] ??
      null,
    image_url: detail.image_url ?? collectPhotoUrls(detail)[0] ?? null,
    latitude: detail.latitude ?? detail.venue?.latitude,
    longitude: detail.longitude ?? detail.venue?.longitude,
    tags: detail.tags,
    vibe: detail.vibe,
  };
}

function asUrlList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is string =>
        typeof entry === 'string' && /^https?:\/\//i.test(entry.trim()),
    );
  }
  if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
    return [value.trim()];
  }
  return [];
}

export function collectPhotoUrls(detail: EventDetail): string[] {
  const urls: string[] = [];
  const push = (value?: string | null) => {
    const next = value?.trim();
    if (!next || !/^https?:\/\//i.test(next) || urls.includes(next)) return;
    urls.push(next);
  };

  push(detail.image_url);
  for (const url of asUrlList(detail.image_urls)) push(url);
  for (const url of asUrlList(detail.photo_urls)) push(url);
  return urls;
}

export function asLabelList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const labels: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string' && entry.trim()) {
      labels.push(entry.trim());
      continue;
    }
    if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>;
      const label =
        (typeof record.name === 'string' && record.name) ||
        (typeof record.label === 'string' && record.label) ||
        (typeof record.title === 'string' && record.title) ||
        null;
      if (label?.trim()) labels.push(label.trim());
    }
  }
  return labels;
}

function toNumber(value?: number | string | null): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCad(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

export function formatDetailPrice(detail: EventDetail): string | null {
  const notes = detail.price_notes?.trim() || null;
  if (detail.is_free === true) {
    return notes ? `Free · ${notes}` : 'Free';
  }

  const min = toNumber(detail.price_min_cad);
  const max = toNumber(detail.price_max_cad);
  let price: string | null = null;
  if (min != null && max != null && min !== max) {
    price = `${formatCad(min)}–${formatCad(max)}`;
  } else if (min != null) {
    price = formatCad(min);
  } else if (max != null) {
    price = formatCad(max);
  } else if (detail.ticketing === 'ticketed') {
    price = 'Ticketed';
  } else if (detail.ticketing === 'donation') {
    price = 'Donation';
  } else if (detail.ticketing === 'door') {
    price = 'Pay at door';
  } else if (detail.ticketing === 'rsvp' || detail.requires_rsvp) {
    price = 'RSVP';
  } else if (detail.is_free === false) {
    price = 'Paid';
  }

  if (price && notes) return `${price} · ${notes}`;
  return price ?? notes;
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

export function formatWhenWithZone(
  value?: string | null,
  timeZone?: string | null,
  options?: { includeZone?: boolean; dateOnly?: boolean },
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const zone = isValidTimeZone(timeZone) ? timeZone : undefined;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(options?.dateOnly
      ? {}
      : { hour: 'numeric', minute: '2-digit' }),
    timeZone: zone,
    timeZoneName: options?.includeZone && !options?.dateOnly ? 'short' : undefined,
  });
}

export function formatTimeOfDay(
  value?: string | null,
  timeZone?: string | null,
): string | null {
  if (!value) return null;
  if (/^\d{1,2}:\d{2}/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const zone = isValidTimeZone(timeZone) ? timeZone : undefined;
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: zone,
  });
}

export function dateKeyInZone(
  value?: string | null,
  timeZone?: string | null,
): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const prefix = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return prefix?.[1] ?? null;
  }
  const zone = isValidTimeZone(timeZone) ? timeZone : undefined;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatScheduleLines(detail: EventDetail): string[] {
  const zone = detail.timezone;
  const lines: string[] = [];

  if (detail.schedule_type === 'date_range' && (detail.range_start_date || detail.range_end_date)) {
    const start =
      formatWhenWithZone(detail.range_start_date, zone, { dateOnly: true }) ??
      detail.range_start_date;
    const end =
      formatWhenWithZone(detail.range_end_date, zone, { dateOnly: true }) ??
      detail.range_end_date;
    if (start && end) lines.push(`${start} – ${end}`);
    else if (start) lines.push(`From ${start}`);
    else if (end) lines.push(`Until ${end}`);

    const dailyStart = formatTimeOfDay(detail.daily_start_time, zone);
    const dailyEnd = formatTimeOfDay(detail.daily_end_time, zone);
    if (dailyStart && dailyEnd) lines.push(`${dailyStart} – ${dailyEnd} daily`);
    else if (dailyStart) lines.push(`From ${dailyStart} daily`);

    const closed = (detail.closed_weekdays ?? [])
      .map((day) => WEEKDAYS[day] ?? null)
      .filter((label): label is string => Boolean(label));
    if (closed.length) lines.push(`Closed ${closed.join(', ')}`);
  } else {
    const start = formatWhenWithZone(detail.starts_at, zone, { includeZone: true });
    const end = formatWhenWithZone(detail.ends_at, zone);
    if (start && end && detail.starts_at && detail.ends_at) {
      const startDay = dateKeyInZone(detail.starts_at, zone);
      const endDay = dateKeyInZone(detail.ends_at, zone);
      if (startDay && endDay && startDay === endDay) {
        const endTime = formatTimeOfDay(detail.ends_at, zone);
        lines.push(endTime ? `${start} – ${endTime}` : start);
      } else {
        lines.push(`${start} – ${end}`);
      }
    } else if (start) {
      lines.push(start);
    }
  }

  if (detail.raw_schedule_text?.trim()) {
    const raw = detail.raw_schedule_text.trim();
    if (!lines.some((line) => line.includes(raw))) lines.push(raw);
  }

  if (isValidTimeZone(zone) && lines.length > 0 && !lines[0].includes(zone)) {
    const zoneLabel = new Date(
      detail.starts_at ?? Date.now(),
    ).toLocaleTimeString(undefined, {
      timeZone: zone,
      timeZoneName: 'short',
      hour: 'numeric',
    });
    const abbr = zoneLabel.split(' ').pop();
    if (abbr && !lines[0].includes(abbr)) {
      lines.push(zone.replace(/_/g, ' '));
    }
  }

  return lines.length ? lines : ['Schedule TBD'];
}

export function formatOccurrenceLine(
  occurrence: { starts_at: string; ends_at: string },
  timeZone?: string | null,
): string {
  const start = formatWhenWithZone(occurrence.starts_at, timeZone, {
    includeZone: true,
  });
  const sameDay =
    dateKeyInZone(occurrence.starts_at, timeZone) ===
    dateKeyInZone(occurrence.ends_at, timeZone);
  const endTime = formatTimeOfDay(occurrence.ends_at, timeZone);
  if (start && endTime && sameDay) {
    return `${start} – ${endTime}`;
  }
  const end = formatWhenWithZone(occurrence.ends_at, timeZone);
  if (start && end) return `${start} – ${end}`;
  return start ?? 'Schedule TBD';
}

export function formatVenueName(detail: EventDetail): string | null {
  return detail.venue?.name?.trim() || detail.raw_venue_name?.trim() || null;
}

export function formatFullAddress(detail: EventDetail): string | null {
  const parts = [
    detail.venue?.address_line || detail.raw_venue_address,
    detail.venue?.neighbourhood || detail.neighbourhood,
    detail.venue?.city,
  ]
    .map((part) => part?.trim() || '')
    .filter(Boolean);
  return [...new Set(parts)].join(', ') || null;
}

export function parseCoord(value?: number | string | null): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function eventCoords(
  detail: EventDetail,
): { lat: number; lng: number } | null {
  const lat =
    parseCoord(detail.latitude) ?? parseCoord(detail.venue?.latitude);
  const lng =
    parseCoord(detail.longitude) ?? parseCoord(detail.venue?.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function mapsSearchUrl(
  lat: number,
  lng: number,
  label?: string | null,
): string {
  const query = encodeURIComponent(label?.trim() || `${lat},${lng}`);
  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?ll=${lat},${lng}&q=${query}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export async function openExternalUrl(url?: string | null): Promise<void> {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    // Ignore platforms that reject the scheme.
  }
}

export function uniqueUrls(...values: Array<string | null | undefined>): string[] {
  const urls: string[] = [];
  for (const value of values) {
    const next = value?.trim();
    if (!next || urls.includes(next)) continue;
    urls.push(next);
  }
  return urls;
}
