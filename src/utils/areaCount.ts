import type { Region } from 'react-native-maps';

import type {
  EventListItem,
  EventMapPin,
  PublicEventListResponse,
} from '../types/events';
import { clusterPins } from './clusterPins';
import { boundsFromRegion, pinInsideBounds, type MapBounds } from './mapViewport';

export function pinMatchesQuery(
  pin: { title?: string | null; neighbourhood?: string | null },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${pin.title ?? ''} ${pin.neighbourhood ?? ''}`.toLowerCase().includes(needle);
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

export type AreaSelection = {
  items: EventListItem[];
  /** True when the payload is the requested box, so `meta.total` is that box. */
  honoured: boolean;
  /** `meta.total` only when the server actually honoured the box. */
  reportedTotal: number | null;
};

/**
 * List rows for the visible box.
 *
 * `meta.total` is the in-view count when `geo.mode` is `bbox`, or when every
 * located row sits inside the box. A payload that still contains events
 * outside the box ignored north/south/east/west, and its `meta.total` is not
 * a box total.
 */
export function selectAreaEvents(
  pages: PublicEventListResponse[] | undefined,
  region: Region | null,
): AreaSelection {
  if (!pages?.length || !region) {
    return { items: [], honoured: false, reportedTotal: null };
  }
  const bounds = boundsFromRegion(region);
  const raw = pages.flatMap((page) => page.items ?? []);
  const items = raw.filter((item) => inBounds(item, bounds));
  const located = raw.filter(hasCoord);
  const anyOutside = located.some((item) => !inBounds(item, bounds));
  const mode = pages[0]?.geo?.mode;
  const honoured = !anyOutside && (mode === 'bbox' || located.length > 0);
  const reported = pages[0]?.meta?.total;
  return {
    items,
    honoured,
    reportedTotal: honoured && typeof reported === 'number' ? reported : null,
  };
}

type CountPin = {
  event_id: string;
  latitude: number;
  longitude: number;
};

/**
 * Shared map chip and list header.
 *
 * Prefer the server box total: map `total`, or list `meta.total` when the
 * list payload is actually that box. `count` on the map payload is only how
 * many pins came back, so it is not a total. The number is never smaller
 * than the pins on screen (de-duplicated points inside the view, or the sum
 * of those cluster badges).
 */
export function countEventsInView(args: {
  pins: CountPin[];
  region: Region | null;
  listPages?: PublicEventListResponse[];
  mapTotal?: number | null;
}): number {
  const { pins, region } = args;
  if (!region) return 0;
  const bounds = boundsFromRegion(region);
  const selection = selectAreaEvents(args.listPages, region);

  let inside = 0;
  for (const pin of pins) {
    if (pin.event_id && pinInsideBounds(pin, bounds)) inside += 1;
  }

  let clusterSum = 0;
  if (pins.length) {
    for (const cluster of clusterPins(pins as EventMapPin[], region)) {
      if (
        pinInsideBounds(
          { latitude: cluster.latitude, longitude: cluster.longitude },
          bounds,
        )
      ) {
        clusterSum += cluster.count;
      }
    }
  }

  const loaded = Math.max(inside, clusterSum);
  const serverCandidates = [selection.reportedTotal, args.mapTotal].filter(
    (value): value is number => typeof value === 'number' && value >= 0,
  );
  const serverTotal = serverCandidates.length ? Math.max(...serverCandidates) : 0;
  return Math.max(serverTotal, loaded);
}
