import type { Region } from 'react-native-maps';

import type { UserGeo } from '../types/common';

/** ~111 km per degree of latitude. */
const KM_PER_DEG_LAT = 111;

/**
 * Map viewport contract for GET /v1/events/map.
 *
 * The app sends the visible region as a bounding box plus a covering
 * radius, and splits a zoomed-out view into a grid of tiles so a
 * server-side cap (nearest-N) cannot collapse every pin into one
 * neighbourhood.
 *
 * Preferred (bbox-aware server):
 *   GET /v1/events/map?north=&south=&east=&west=&limit=
 *   Header X-User-Lat / X-User-Lng is the tile centre (distance only).
 *   Return events inside the box. `total` is the number of events in that
 *   box (`count` is only how many items are in this payload). The app
 *   requests the visible box, so `total` is the "events in view" count and
 *   matches GET /v1/events `meta.total` for the same box.
 *   If `limit` truncates the box, spread the sample across the box (grid
 *   or random), do not return only the N closest to the header coordinate.
 *
 * Fallback (server ignores unknown bbox params, or answers 400/422):
 *   The same call without north/south/east/west, with radius_km large
 *   enough to cover that tile and the tile centre in the geo headers.
 *   Tiling still spreads a nearest-N cap across the city.
 */
export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapTile = MapBounds & {
  center: UserGeo;
  /** Circle that covers this tile, for servers that only understand radius. */
  radiusKm: number;
};

/** Per-tile cap. Downtown boxes of a few hundred events fit in one tile. */
export const MAP_TILE_EVENT_LIMIT = 500;

/**
 * How far past the new camera we keep pins that were already loaded.
 * Zooming in does not drop events that are still on screen. The network
 * request itself stays the visible box so `total` matches that box.
 */
export const MAP_FETCH_OVERSCAN = 0.4;

/** Grow the region by `fraction` of its size past every edge. */
export function expandRegion(region: Region, fraction = MAP_FETCH_OVERSCAN): Region {
  const grow = 1 + fraction * 2;
  return {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: region.latitudeDelta * grow,
    longitudeDelta: region.longitudeDelta * grow,
  };
}

export function boundsFromRegion(region: Region): MapBounds {
  return {
    north: region.latitude + region.latitudeDelta / 2,
    south: region.latitude - region.latitudeDelta / 2,
    east: region.longitude + region.longitudeDelta / 2,
    west: region.longitude - region.longitudeDelta / 2,
  };
}

/** Half-diagonal of the box in km, slightly padded, capped per request. */
export function radiusKmForBounds(bounds: MapBounds): number {
  const latKm = ((bounds.north - bounds.south) / 2) * KM_PER_DEG_LAT;
  const midLat = (bounds.north + bounds.south) / 2;
  const cos = Math.cos((midLat * Math.PI) / 180);
  const lngKm =
    ((bounds.east - bounds.west) / 2) * KM_PER_DEG_LAT * Math.max(cos, 0.01);
  return Math.min(160, Math.hypot(latKm, lngKm) * 1.08);
}

/**
 * One tile when the view is a neighbourhood. Two-by-two once a city
 * fits on screen. Three-by-three when the view is metro-wide, so a
 * nearest-N cap cannot leave only downtown pins.
 */
export function tilesForRegion(region: Region): MapTile[] {
  const bounds = boundsFromRegion(region);
  const radius = radiusKmForBounds(bounds);
  const grid = radius >= 35 ? 3 : radius >= 10 ? 2 : 1;
  const latSpan = bounds.north - bounds.south;
  const lngSpan = bounds.east - bounds.west;
  const tiles: MapTile[] = [];

  for (let row = 0; row < grid; row += 1) {
    for (let col = 0; col < grid; col += 1) {
      const tile: MapBounds = {
        north: bounds.north - (row * latSpan) / grid,
        south: bounds.north - ((row + 1) * latSpan) / grid,
        west: bounds.west + (col * lngSpan) / grid,
        east: bounds.west + ((col + 1) * lngSpan) / grid,
      };
      tiles.push({
        ...tile,
        center: {
          lat: (tile.north + tile.south) / 2,
          lng: (tile.east + tile.west) / 2,
        },
        radiusKm: Math.max(1, radiusKmForBounds(tile)),
      });
    }
  }

  return tiles;
}

/**
 * Fraction of the viewport the centre must move before a pan refetches.
 * Smaller drifts keep the current pins.
 */
export const VIEWPORT_MOVE_FRACTION = 0.28;

/** Wait until the finger has been up before committing a new area. */
export const VIEWPORT_COMMIT_MS = 700;

/** Integer zoom. Street level and closer shows individual pins. */
export const STREET_ZOOM = 16;

export function zoomLevelFromRegion(region: Region): number {
  return Math.log2(360 / Math.max(region.latitudeDelta, 1e-6));
}

export function zoomBucket(region: Region): number {
  return Math.max(0, Math.floor(zoomLevelFromRegion(region)));
}

/**
 * True when the camera should load a new area: the integer zoom changed,
 * or the centre moved by more than ~28% of the viewport. A small pan is not
 * enough.
 */
export function viewportMeaningfullyChanged(prev: Region, next: Region): boolean {
  if (zoomBucket(prev) !== zoomBucket(next)) return true;
  const latShift = Math.abs(next.latitude - prev.latitude);
  const lngShift = Math.abs(next.longitude - prev.longitude);
  return (
    latShift > Math.abs(prev.latitudeDelta) * VIEWPORT_MOVE_FRACTION ||
    lngShift > Math.abs(prev.longitudeDelta) * VIEWPORT_MOVE_FRACTION
  );
}

export function pinInsideBounds(
  pin: { latitude: number; longitude: number },
  bounds: MapBounds,
): boolean {
  return (
    pin.latitude <= bounds.north + 1e-6 &&
    pin.latitude >= bounds.south - 1e-6 &&
    pin.longitude <= bounds.east + 1e-6 &&
    pin.longitude >= bounds.west - 1e-6
  );
}

/**
 * Keep pins that are still inside the committed view, then overlay fresher
 * rows by event id. Pins already on screen keep their identity so markers
 * are not torn down on every response.
 */
export function mergeViewportPins<T extends { event_id: string; latitude: number; longitude: number }>(
  previous: T[],
  incoming: T[],
  bounds: MapBounds,
): T[] {
  const byId = new Map<string, T>();
  for (const pin of previous) {
    if (pinInsideBounds(pin, bounds)) byId.set(pin.event_id, pin);
  }
  for (const pin of incoming) {
    if (pinInsideBounds(pin, bounds)) byId.set(pin.event_id, pin);
  }
  return [...byId.values()];
}

/** Stable query key so sub-pixel camera noise does not refetch. */
export function quantizeRegion(region: Region): Region {
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return {
    latitude: round(region.latitude),
    longitude: round(region.longitude),
    latitudeDelta: round(region.latitudeDelta),
    longitudeDelta: round(region.longitudeDelta),
  };
}
