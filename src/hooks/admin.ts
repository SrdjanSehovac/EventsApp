import { useQuery } from '@tanstack/react-query';

import {
  fetchAdminCities,
  fetchAdminEvent,
  fetchAdminEvents,
  fetchAdminOverview,
} from '../api/admin';
import type { AdminEventListParams } from '../types/admin';

export const adminKeys = {
  all: ['admin'] as const,
  overview: () => [...adminKeys.all, 'overview'] as const,
  cities: () => [...adminKeys.all, 'cities'] as const,
  events: () => [...adminKeys.all, 'events'] as const,
  eventList: (params: AdminEventListParams) =>
    [...adminKeys.events(), 'list', params] as const,
  eventDetail: (eventId: string) =>
    [...adminKeys.events(), 'detail', eventId] as const,
};

export function useAdminOverview(enabled = true) {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: ({ signal }) => fetchAdminOverview(signal),
    enabled,
  });
}

export function useAdminCities(enabled = true) {
  return useQuery({
    queryKey: adminKeys.cities(),
    queryFn: ({ signal }) => fetchAdminCities(signal),
    enabled,
  });
}

export function useAdminEvents(
  params: AdminEventListParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: adminKeys.eventList(params),
    queryFn: ({ signal }) => fetchAdminEvents(params, signal),
    enabled,
  });
}

export function useAdminEvent(eventId: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.eventDetail(eventId),
    queryFn: ({ signal }) => fetchAdminEvent(eventId, signal),
    enabled: enabled && Boolean(eventId),
  });
}
