import type { Region } from 'react-native-maps';

import type { EventMapPin } from '../types/events';

export type PinCluster = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  pins: EventMapPin[];
};

/**
 * Below this latitudeDelta (~street / tight neighbourhood), stop grid
 * clustering so pins sit at their true lat/lng. Coincident pins still
 * share a count badge via {@link clusterCoincident}.
 */
const UNCLUSTER_LAT_DELTA = 0.012;

/** ~1.1 m — pins closer than this are treated as the same spot. */
const COINCIDENT_DECIMALS = 5;

function toSingle(pin: EventMapPin): PinCluster {
  return {
    id: pin.event_id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    count: 1,
    pins: [pin],
  };
}

function fromGroup(group: EventMapPin[]): PinCluster {
  if (group.length === 1) return toSingle(group[0]);

  const latitude =
    group.reduce((sum, pin) => sum + pin.latitude, 0) / group.length;
  const longitude =
    group.reduce((sum, pin) => sum + pin.longitude, 0) / group.length;
  const ids = group.map((pin) => pin.event_id).sort();

  return {
    id: `cluster:${ids.join(',')}`,
    latitude,
    longitude,
    count: group.length,
    pins: group,
  };
}

/** Always keep exact same-coordinate pins in one count badge. */
function clusterCoincident(pins: EventMapPin[]): PinCluster[] {
  const buckets = new Map<string, EventMapPin[]>();

  for (const pin of pins) {
    if (!Number.isFinite(pin.latitude) || !Number.isFinite(pin.longitude)) {
      continue;
    }
    const key = `${pin.latitude.toFixed(COINCIDENT_DECIMALS)}:${pin.longitude.toFixed(COINCIDENT_DECIMALS)}`;
    const group = buckets.get(key);
    if (group) group.push(pin);
    else buckets.set(key, [pin]);
  }

  return [...buckets.values()].map(fromGroup);
}

/**
 * Zoom-dependent grid clustering for native maps.
 * Cell size shrinks with the camera so zooming in splits count badges
 * into accurate individual pins (Realtor.ca-style).
 */
export function clusterPins(
  pins: EventMapPin[],
  region: Region | null,
): PinCluster[] {
  if (!pins.length) return [];

  if (!region || region.latitudeDelta < UNCLUSTER_LAT_DELTA) {
    return clusterCoincident(pins);
  }

  // ~50px cluster radius on a typical phone map → ~12 cells across viewport
  const latCell = Math.max(region.latitudeDelta / 12, 0.0025);
  const lngCell = Math.max(region.longitudeDelta / 12, 0.0025);
  const buckets = new Map<string, EventMapPin[]>();

  for (const pin of pins) {
    if (!Number.isFinite(pin.latitude) || !Number.isFinite(pin.longitude)) {
      continue;
    }
    const key = `${Math.round(pin.latitude / latCell)}:${Math.round(pin.longitude / lngCell)}`;
    const group = buckets.get(key);
    if (group) group.push(pin);
    else buckets.set(key, [pin]);
  }

  return [...buckets.values()].map(fromGroup);
}

export function regionForCluster(cluster: PinCluster): Region {
  const lats = cluster.pins.map((pin) => pin.latitude);
  const lngs = cluster.pins.map((pin) => pin.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.018),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.018),
  };
}

/** True when a cluster still covers enough ground to zoom into. */
export function clusterNeedsZoom(cluster: PinCluster): boolean {
  if (cluster.count < 2) return false;
  const lats = cluster.pins.map((pin) => pin.latitude);
  const lngs = cluster.pins.map((pin) => pin.longitude);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  return latSpan > 0.0008 || lngSpan > 0.0008;
}
