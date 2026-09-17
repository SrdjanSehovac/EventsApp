import { apiRequest } from './client';
import type { EventListItem, PublicEventListResponse } from '../types/events';
import type { PaginationMeta } from '../types/common';

/**
 * EventServer favourites contract (User.favourites relationship), under `/v1`:
 *   GET    /me/favourites
 *   PUT    /me/favourites/{event_id}
 *   DELETE /me/favourites/{event_id}
 */
export type FavouritesResponse = {
  items: EventListItem[];
  meta?: PaginationMeta;
};

type RawFavourites =
  | EventListItem[]
  | {
      items?: EventListItem[];
      events?: EventListItem[];
      favourites?: EventListItem[];
      favorites?: EventListItem[];
      meta?: PaginationMeta;
    };

function normalizeFavourites(raw: RawFavourites): FavouritesResponse {
  if (Array.isArray(raw)) {
    return { items: raw };
  }

  const items =
    raw.items ?? raw.events ?? raw.favourites ?? raw.favorites ?? [];
  return { items, meta: raw.meta };
}

export async function fetchFavourites(
  signal?: AbortSignal,
): Promise<FavouritesResponse> {
  const raw = await apiRequest<RawFavourites>({
    path: '/me/favourites',
    signal,
  });
  return normalizeFavourites(raw);
}

export async function addFavourite(eventId: string) {
  await apiRequest<void>({
    path: `/me/favourites/${eventId}`,
    method: 'PUT',
  });
}

export async function removeFavourite(eventId: string) {
  await apiRequest<void>({
    path: `/me/favourites/${eventId}`,
    method: 'DELETE',
  });
}

export type { PublicEventListResponse };
