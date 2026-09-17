import { apiRequest } from './client';
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
