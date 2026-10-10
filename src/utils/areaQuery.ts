import type { Region } from 'react-native-maps';

import {
  filtersToParams,
  type EventsFilterState,
} from '../components/EventFilters';
import type { PublicEventListParams, PublicSortField } from '../types/events';
import { boundsFromRegion } from './mapViewport';

export {
  countEventsInView,
  pinMatchesQuery,
  selectAreaEvents,
  type AreaSelection,
} from './areaCount';

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
