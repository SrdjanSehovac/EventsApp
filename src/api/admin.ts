import { apiRequest } from './client';
import type {
  AdminCitiesResponse,
  AdminEventDetail,
  AdminEventListParams,
  AdminEventListResponse,
  AdminOverview,
} from '../types/admin';

export function fetchAdminOverview(signal?: AbortSignal) {
  return apiRequest<AdminOverview>({
    path: '/admin/overview',
    signal,
  });
}

export function fetchAdminCities(signal?: AbortSignal) {
  return apiRequest<AdminCitiesResponse>({
    path: '/admin/cities',
    signal,
  });
}

export function fetchAdminEvents(
  params: AdminEventListParams = {},
  signal?: AbortSignal,
) {
  return apiRequest<AdminEventListResponse>({
    path: '/admin/events',
    query: params,
    signal,
  });
}

export function fetchAdminEvent(
  eventId: string,
  signal?: AbortSignal,
) {
  return apiRequest<AdminEventDetail>({
    path: `/admin/events/${eventId}`,
    signal,
  });
}
