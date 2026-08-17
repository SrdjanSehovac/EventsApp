import type { Region } from 'react-native-maps';

import type { UserGeo } from '../types/common';

/** ~111 km per degree of latitude */
const KM_PER_DEG_LAT = 111;

export const DEFAULT_MAP_GEO: UserGeo = {
  lat: 43.6532,
  lng: -79.3832,
};

/** Search + camera radius on first load / recenter. */
export const INITIAL_RADIUS_KM = 10;

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 100;

/** Center move (degrees) or radius change (km) vs last settled search. */
const CENTER_DIRTY_DEG = 0.02;
const RADIUS_DIRTY_KM = 2.5;

export function regionForRadiusKm(
  center: UserGeo,
  radiusKm: number,
): Region {
  const latitudeDelta = (2 * radiusKm) / KM_PER_DEG_LAT;
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  const longitudeDelta =
    cosLat > 0.01
      ? (2 * radiusKm) / (KM_PER_DEG_LAT * cosLat)
      : latitudeDelta;

  return {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta,
    longitudeDelta,
  };
}

export function radiusKmFromRegion(region: Region): number {
  const radius = (region.latitudeDelta / 2) * KM_PER_DEG_LAT;
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, radius));
}

export function geoFromRegion(region: Region): UserGeo {
  return {
    lat: region.latitude,
    lng: region.longitude,
  };
}

/** Compare the live camera to the last settled / searched baseline region. */
export function isRegionDirty(current: Region, baseline: Region): boolean {
  const centerMoved =
    Math.abs(current.latitude - baseline.latitude) > CENTER_DIRTY_DEG ||
    Math.abs(current.longitude - baseline.longitude) > CENTER_DIRTY_DEG;
  const radiusMoved =
    Math.abs(radiusKmFromRegion(current) - radiusKmFromRegion(baseline)) >
    RADIUS_DIRTY_KM;
  return centerMoved || radiusMoved;
}
