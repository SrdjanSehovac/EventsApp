import { apiRequest } from './client';
import type { SubmitEventInput, SubmittedEvent } from '../types/submissions';

/**
 * Crowdsourced events contract (expected under `/v1`, Bearer required):
 *   POST /me/events  { title, description, city, venue_name, address,
 *                     starts_at, price_cad, is_free, category_slug,
 *                     photo_urls?, video_url?, bio? }
 *                   → SubmittedEvent (or `{ item }` / `{ event }`)
 *   GET  /me/events  → `{ items: SubmittedEvent[] }` (or a bare array)
 *
 * EventServer can store these as pending until moderation. The client also
 * caches submissions locally so Profile → My submissions works before the
 * route exists.
 */
export type SubmitEventResponse = SubmittedEvent & {
  item?: SubmittedEvent;
  event?: SubmittedEvent;
  submission?: SubmittedEvent;
};

type RawList =
  | SubmittedEvent[]
  | {
      items?: SubmittedEvent[];
      events?: SubmittedEvent[];
      submissions?: SubmittedEvent[];
    };

type RawSubmitted = Partial<SubmittedEvent> & {
  event_id?: string;
};

function asSubmitted(
  raw: RawSubmitted | null | undefined,
  fallback: SubmitEventInput,
): SubmittedEvent {
  const data = raw ?? {};
  return {
    submission_id: String(
      data.submission_id ?? data.event_id ?? `local-${Date.now()}`,
    ),
    title: data.title ?? fallback.title,
    description: data.description ?? fallback.description,
    city: data.city ?? fallback.city,
    venue_name: data.venue_name ?? fallback.venue_name,
    address: data.address ?? fallback.address,
    starts_at: data.starts_at ?? fallback.starts_at,
    price_cad: data.price_cad ?? fallback.price_cad ?? null,
    is_free: data.is_free ?? fallback.is_free,
    category_slug: data.category_slug ?? fallback.category_slug ?? null,
    category_name: data.category_name ?? fallback.category_name ?? null,
    photo_urls: data.photo_urls ?? fallback.photo_urls ?? [],
    video_url: data.video_url ?? fallback.video_url ?? null,
    bio: data.bio ?? fallback.bio ?? null,
    status: data.status ?? 'pending',
    created_at: data.created_at ?? new Date().toISOString(),
    source: 'server',
  };
}

function normalizeList(raw: RawList): SubmittedEvent[] {
  const items = Array.isArray(raw)
    ? raw
    : (raw.items ?? raw.events ?? raw.submissions ?? []);
  return items.map((item) =>
    asSubmitted(item, {
      title: item.title ?? 'Untitled event',
      description: item.description ?? '',
      city: item.city ?? '',
      venue_name: item.venue_name ?? '',
      address: item.address ?? '',
      starts_at: item.starts_at ?? new Date().toISOString(),
      is_free: item.is_free ?? true,
      price_cad: item.price_cad ?? null,
      category_slug: item.category_slug ?? null,
      category_name: item.category_name ?? null,
      photo_urls: item.photo_urls ?? [],
      video_url: item.video_url ?? null,
      bio: item.bio ?? null,
    }),
  );
}

export async function fetchMySubmissions(signal?: AbortSignal): Promise<SubmittedEvent[]> {
  const raw = await apiRequest<RawList>({
    path: '/me/events',
    signal,
  });
  return normalizeList(raw);
}

export async function submitEvent(input: SubmitEventInput): Promise<SubmittedEvent> {
  const payload = await apiRequest<SubmitEventResponse>({
    path: '/me/events',
    method: 'POST',
    body: {
      title: input.title,
      description: input.description || null,
      city: input.city,
      venue_name: input.venue_name || null,
      address: input.address || null,
      starts_at: input.starts_at,
      price_cad: input.is_free ? 0 : input.price_cad ?? null,
      is_free: input.is_free,
      category_slug: input.category_slug || null,
      photo_urls: input.photo_urls?.length ? input.photo_urls : null,
      video_url: input.video_url || null,
      bio: input.bio?.trim() || null,
    },
  });

  const nested = payload.item ?? payload.event ?? payload.submission;
  return asSubmitted(nested ?? payload, input);
}
