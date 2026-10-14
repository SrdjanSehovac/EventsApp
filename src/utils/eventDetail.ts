import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

import type {
  EventDetail,
  EventListItem,
  EventMapPin,
} from '../types/events';
import { formatPlaceLines } from './eventPresentation';
import {
  allowedImageUrl,
  allowedOutboundUrl,
  isBlockedUrl,
} from './outboundLinks';

export {
  formatAboutBody,
  formatActionLabel,
  hostedByLine,
  organizerPageUrl,
  formatDetailPrice,
  formatOccurrenceLine,
  formatPlaceLines,
  formatScheduleLines,
  isSchemaOrgType,
} from './eventPresentation';

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
    price_min_cad: pin.price_min_cad,
    price_max_cad: pin.price_max_cad,
    sale_kind: pin.sale_kind,
    neighbourhood: pin.neighbourhood,
    city: pin.city,
    primary_category: pin.primary_category,
    image_url: allowedImageUrl(pin.image_url),
    image_fallback: pin.image_fallback,
    external_url: pin.external_url,
    checkout_url: pin.checkout_url,
    eventbrite_event_id: pin.eventbrite_event_id,
    link_type: pin.link_type,
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
    price_min_cad: detail.price_min_cad,
    price_max_cad: detail.price_max_cad,
    sale_kind: detail.sale_kind,
    neighbourhood: detail.neighbourhood ?? detail.venue?.neighbourhood,
    city: detail.venue?.city ?? null,
    primary_category:
      detail.categories.find((c) => c.is_primary) ??
      detail.categories[0] ??
      null,
    image_url:
      allowedImageUrl(detail.image_url) ?? collectPhotoUrls(detail)[0] ?? null,
    image_fallback: detail.image_fallback,
    external_url: detail.external_url,
    checkout_url: detail.checkout_url,
    eventbrite_event_id: detail.eventbrite_event_id,
    link_type: detail.link_type,
    latitude: detail.latitude ?? detail.venue?.latitude,
    longitude: detail.longitude ?? detail.venue?.longitude,
    tags: detail.tags,
    vibe: detail.vibe,
    verified_organizer: detail.verified_organizer,
  };
}

function imageSrc(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const src = record.url ?? record.src ?? record.image_url;
  return typeof src === 'string' ? src : null;
}

function asUrlList(value: unknown): string[] {
  if (!value) return [];
  const entries = Array.isArray(value) ? value : [value];
  const urls: string[] = [];
  for (const entry of entries) {
    const src = allowedImageUrl(imageSrc(entry));
    if (src) urls.push(src);
  }
  return urls;
}

export function collectPhotoUrls(detail: EventDetail): string[] {
  const urls: string[] = [];
  const push = (value?: string | null) => {
    const next = value?.trim();
    if (!next || !/^https?:\/\//i.test(next) || urls.includes(next)) return;
    urls.push(next);
  };

  push(allowedImageUrl(detail.image_url));
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

export function formatVenueName(detail: EventDetail): string | null {
  return formatPlaceLines(detail).name;
}

export function formatFullAddress(detail: EventDetail): string | null {
  return formatPlaceLines(detail).address;
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

/** Maps and other non-ticket links. Ticket buttons use the in-app checkout. */
export async function openExternalUrl(url?: string | null): Promise<void> {
  const next = allowedOutboundUrl(url);
  if (!next || isBlockedUrl(next)) return;
  try {
    await Linking.openURL(next);
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
