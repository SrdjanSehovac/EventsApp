import type { Region } from 'react-native-maps';

import {
  filtersToParams,
  type EventsFilterState,
} from '../components/EventFilters';
import type {
  EventListItem,
  PublicEventListParams,
  PublicEventListResponse,
  PublicSortField,
} from '../types/events';
import { boundsFromRegion, pinInsideBounds, type MapBounds } from './mapViewport';

/**
 * List query for the shared map viewport.
 *
 * GET /v1/events?north=&south=&east=&west=&page=&page_size=
 * with the same city, category, date, and text filters as the map.
 * `meta.total` should be the number of events inside the box.
 * `radius_km` is omitted so a nearest-N sample cannot replace the area.
 */
export function buildAreaListParams(
  filters: EventsFilterState,
  sort: PublicSortField,
  region: Region,
): Omit<PublicEventListParams, 'page'> {
  const bounds = boundsFromRegion(region);
  const base = filtersToParams({ ...filters }, sort);
  return {
    ...base,
    radius_km: undefined,
    north: Number(bounds.north.toFixed(5)),
    south: Number(bounds.south.toFixed(5)),
    east: Number(bounds.east.toFixed(5)),
    west: Number(bounds.west.toFixed(5)),
    page_size: 24,
  };
}

function hasCoord(item: EventListItem): boolean {
  const lat = Number(item.latitude);
  const lng = Number(item.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function inBounds(item: EventListItem, bounds: MapBounds): boolean {
  if (!hasCoord(item)) return false;
  return pinInsideBounds(
    { latitude: Number(item.latitude), longitude: Number(item.longitude) },
    bounds,
  );
}

/**
 * Events inside the committed map area. When the server honours the box,
 * `total` is `meta.total`. When rows fall outside the box, the total is the
 * filtered length so the map chip and the list cannot disagree.
 */
export function selectAreaEvents(
  pages: PublicEventListResponse[] | undefined,
  region: Region | null,
): { items: EventListItem[]; total: number } {
  if (!pages?.length || !region) return { items: [], total: 0 };
  const bounds = boundsFromRegion(region);
  const raw = pages.flatMap((page) => page.items ?? []);
  const items = raw.filter((item) => inBounds(item, bounds));
  const located = raw.filter(hasCoord);
  const serverHonoured =
    located.length === 0 || located.every((item) => inBounds(item, bounds));
  const reported = pages[0]?.meta?.total;
  const total =
    serverHonoured && typeof reported === 'number' ? reported : items.length;
  return { items, total };
}
