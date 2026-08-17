import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import {
  fetchCities,
  fetchEvent,
  fetchEvents,
  fetchMapEvents,
  fetchNeighbourhoods,
  fetchSimilarEvents,
  fetchTodayEvents,
  searchEvents,
} from '../api/events';
import type { UserGeo } from '../types/common';
import type {
  MapEventsParams,
  NeighbourhoodsParams,
  PublicEventListParams,
  SearchEventsParams,
  SimilarEventsParams,
  TodayEventsParams,
} from '../types/events';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: PublicEventListParams, geo?: UserGeo | null) =>
    [...eventKeys.lists(), params, geo ?? null] as const,
  infinite: (
    params: Omit<PublicEventListParams, 'page'>,
    geo?: UserGeo | null,
  ) => [...eventKeys.lists(), 'infinite', params, geo ?? null] as const,
  map: (params: MapEventsParams, geo?: UserGeo | null) =>
    [...eventKeys.all, 'map', params, geo ?? null] as const,
  today: (params: TodayEventsParams, geo?: UserGeo | null) =>
    [...eventKeys.all, 'today', params, geo ?? null] as const,
  search: (params: SearchEventsParams, geo?: UserGeo | null) =>
    [...eventKeys.all, 'search', params, geo ?? null] as const,
  detail: (eventId: string) => [...eventKeys.all, 'detail', eventId] as const,
  similar: (params: SimilarEventsParams) =>
    [...eventKeys.all, 'similar', params] as const,
  cities: () => [...eventKeys.all, 'cities'] as const,
  neighbourhoods: (params: NeighbourhoodsParams) =>
    [...eventKeys.all, 'neighbourhoods', params] as const,
};

export function useEvents(
  params: PublicEventListParams = {},
  geo?: UserGeo | null,
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.list(params, geo),
    queryFn: ({ signal }) => fetchEvents(params, geo, signal),
    enabled,
  });
}

export function useInfiniteEvents(
  params: Omit<PublicEventListParams, 'page'> = {},
  geo?: UserGeo | null,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: eventKeys.infinite(params, geo),
    queryFn: ({ pageParam, signal }) =>
      fetchEvents({ ...params, page: pageParam }, geo, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.meta;
      return page < total_pages ? page + 1 : undefined;
    },
    enabled,
  });
}

export function useMapEvents(
  params: MapEventsParams = {},
  geo?: UserGeo | null,
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.map(params, geo),
    queryFn: ({ signal }) => fetchMapEvents(params, geo, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useTodayEvents(
  params: TodayEventsParams = {},
  geo?: UserGeo | null,
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.today(params, geo),
    queryFn: ({ signal }) => fetchTodayEvents(params, geo, signal),
    enabled,
  });
}

export function useSearchEvents(
  params: SearchEventsParams,
  geo?: UserGeo | null,
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.search(params, geo),
    queryFn: ({ signal }) => searchEvents(params, geo, signal),
    enabled: enabled && params.q.trim().length > 0,
  });
}

export function useEvent(eventId: string, enabled = true) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: ({ signal }) => fetchEvent(eventId, signal),
    enabled: enabled && Boolean(eventId),
  });
}

export function useSimilarEvents(
  params: SimilarEventsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.similar(params),
    queryFn: ({ signal }) => fetchSimilarEvents(params, signal),
    enabled: enabled && Boolean(params.eventId),
  });
}

export function useCities(enabled = true) {
  return useQuery({
    queryKey: eventKeys.cities(),
    queryFn: ({ signal }) => fetchCities(signal),
    enabled,
  });
}

export function useNeighbourhoods(
  params: NeighbourhoodsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.neighbourhoods(params),
    queryFn: ({ signal }) => fetchNeighbourhoods(params, signal),
    enabled,
  });
}
