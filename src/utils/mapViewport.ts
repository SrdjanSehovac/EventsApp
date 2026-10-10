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
 *   Return events inside the box. If `limit` truncates the box, spread
 *   the sample across the box (grid or random), do not return only the
 *   N closest to the header coordinate.
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

export const MAP_TILE_EVENT_LIMIT = 200;

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
