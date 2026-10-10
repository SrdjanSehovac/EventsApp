import type { Region } from 'react-native-maps';

import { MAP_TILE_EVENT_LIMIT, tilesForRegion, type MapTile } from '../utils/mapViewport';
import { ApiError, apiRequest } from './client';
import type { UserGeo } from '../types/common';
import type {
  CityCount,
  EventDetail,
  MapEventsParams,
  MapEventsResponse,
  NeighbourhoodCount,
  NeighbourhoodsParams,
  PublicEventListParams,
  PublicEventListResponse,
  SearchEventsParams,
  SearchEventsResponse,
  SimilarEventsParams,
  SimilarEventsResponse,
  TodayEventsParams,
  TodayEventsResponse,
} from '../types/events';

export function fetchEvents(
  params: PublicEventListParams = {},
  geo?: UserGeo | null,
  signal?: AbortSignal,
) {
  return apiRequest<PublicEventListResponse>({
    path: '/events',
    query: params,
    geo,
    signal,
  });
}

export function fetchMapEvents(
  params: MapEventsParams = {},
  geo?: UserGeo | null,
  signal?: AbortSignal,
) {
  return apiRequest<MapEventsResponse>({
    path: '/events/map',
    query: params,
    geo,
    signal,
  });
}

/** Remember a server that rejects bbox params for the rest of this session. */
let mapBBoxUnsupported = false;

async function fetchMapTile(
  params: Omit<
    MapEventsParams,
    'north' | 'south' | 'east' | 'west' | 'radius_km' | 'limit'
  >,
  tile: MapTile,
  signal?: AbortSignal,
) {
  const radiusParams: MapEventsParams = {
    ...params,
    radius_km: Number(tile.radiusKm.toFixed(2)),
    limit: MAP_TILE_EVENT_LIMIT,
  };

  if (!mapBBoxUnsupported) {
    try {
      return await fetchMapEvents(
        {
          ...radiusParams,
          north: Number(tile.north.toFixed(5)),
          south: Number(tile.south.toFixed(5)),
          east: Number(tile.east.toFixed(5)),
          west: Number(tile.west.toFixed(5)),
        },
        tile.center,
        signal,
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 400 || error.status === 422)
      ) {
        mapBBoxUnsupported = true;
      } else {
        throw error;
      }
    }
  }

  return fetchMapEvents(radiusParams, tile.center, signal);
}

/**
 * Events for the visible map. Zoomed-out regions are split into tiles so a
 * nearest-N cap cannot leave pins in only one part of the city.
 * See the contract note in `src/utils/mapViewport.ts`.
 */
export async function fetchViewportMapEvents(
  params: Omit<
    MapEventsParams,
    'north' | 'south' | 'east' | 'west' | 'radius_km' | 'limit'
  >,
  region: Region,
  signal?: AbortSignal,
): Promise<MapEventsResponse> {
  const tiles = tilesForRegion(region);
  const settled = await Promise.allSettled(
    tiles.map((tile) => fetchMapTile(params, tile, signal)),
  );
  const pages = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  if (pages.length === 0) {
    const failure = settled.find((result) => result.status === 'rejected');
    if (failure && failure.status === 'rejected') throw failure.reason;
    throw new Error('Failed to load map events');
  }

  const byId = new Map<string, MapEventsResponse['items'][number]>();
  for (const page of pages) {
    for (const pin of page.items ?? []) {
      if (pin?.event_id) byId.set(pin.event_id, pin);
    }
  }

  return {
    geo: pages[0].geo,
    items: [...byId.values()],
    count: byId.size,
  };
}

export function fetchTodayEvents(
  params: TodayEventsParams = {},
  geo?: UserGeo | null,
  signal?: AbortSignal,
) {
  return apiRequest<TodayEventsResponse>({
    path: '/events/today',
    query: params,
    geo,
    signal,
  });
}

export function searchEvents(
  params: SearchEventsParams,
  geo?: UserGeo | null,
  signal?: AbortSignal,
) {
  return apiRequest<SearchEventsResponse>({
    path: '/events/search',
    query: params,
    geo,
    signal,
  });
}

type EventDetailResponse = EventDetail & {
  item?: EventDetail;
  event?: EventDetail;
  data?: EventDetail;
};

function unwrapEventDetail(raw: EventDetailResponse): EventDetail {
  return raw.event ?? raw.item ?? raw.data ?? raw;
}

export async function fetchEvent(
  eventId: string,
  signal?: AbortSignal,
) {
  const raw = await apiRequest<EventDetailResponse>({
    path: `/events/${eventId}`,
    signal,
  });
  return unwrapEventDetail(raw);
}

export function fetchSimilarEvents(
  { eventId, ...params }: SimilarEventsParams,
  signal?: AbortSignal,
) {
  return apiRequest<SimilarEventsResponse>({
    path: `/events/${eventId}/similar`,
    query: params,
    signal,
  });
}

export function fetchCities(signal?: AbortSignal) {
  return apiRequest<CityCount[]>({
    path: '/events/cities',
    signal,
  });
}

export function fetchNeighbourhoods(
  params: NeighbourhoodsParams = {},
  signal?: AbortSignal,
) {
  return apiRequest<NeighbourhoodCount[]>({
    path: '/events/neighbourhoods',
    query: params,
    signal,
  });
}
