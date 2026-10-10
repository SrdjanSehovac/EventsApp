import type { Region } from 'react-native-maps';

import type { EventMapPin } from '../types/events';
import { STREET_ZOOM, zoomBucket } from './mapViewport';

export type PinCluster = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  pins: EventMapPin[];
};

/** How many cluster cells fit across one zoom-bucket span. */
const CELLS_ACROSS = 10;

/** ~1.1 m — pins closer than this share one count badge. */
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

  return [...buckets.values()].map((group) => {
    if (group.length === 1) return toSingle(group[0]);
    const latitude =
      group.reduce((sum, pin) => sum + pin.latitude, 0) / group.length;
    const longitude =
      group.reduce((sum, pin) => sum + pin.longitude, 0) / group.length;
    const spot = `${group[0].latitude.toFixed(COINCIDENT_DECIMALS)}:${group[0].longitude.toFixed(COINCIDENT_DECIMALS)}`;
    return {
      id: `spot:${spot}`,
      latitude,
      longitude,
      count: group.length,
      pins: group,
    };
  });
}

/**
 * Cluster on a grid fixed to the integer zoom bucket. Panning does not
 * move cell edges, so badges stay put until the user zooms far enough to
 * change the bucket. Street zoom and closer returns individual pins.
 */
export function clusterPins(
  pins: EventMapPin[],
  region: Region | null,
): PinCluster[] {
  if (!pins.length) return [];

  const zoom = region ? zoomBucket(region) : 11;
  if (!region || zoom >= STREET_ZOOM) {
    return clusterCoincident(pins);
  }

  const cell = 360 / 2 ** zoom / CELLS_ACROSS;
  const buckets = new Map<string, EventMapPin[]>();

  for (const pin of pins) {
    if (!Number.isFinite(pin.latitude) || !Number.isFinite(pin.longitude)) {
      continue;
    }
    const latIndex = Math.round(pin.latitude / cell);
    const lngIndex = Math.round(pin.longitude / cell);
    const key = `${latIndex}:${lngIndex}`;
    const group = buckets.get(key);
    if (group) group.push(pin);
    else buckets.set(key, [pin]);
  }

  return [...buckets.values()].map((group) => {
    if (group.length === 1) return toSingle(group[0]);
    const latIndex = Math.round(group[0].latitude / cell);
    const lngIndex = Math.round(group[0].longitude / cell);
    return {
      id: `z${zoom}:${latIndex}:${lngIndex}`,
      latitude: latIndex * cell,
      longitude: lngIndex * cell,
      count: group.length,
      pins: group,
    };
  });
}

const STREET_LAT_DELTA = 360 / 2 ** STREET_ZOOM;

/** Fit the cluster, and zoom at least to street level so tight groups split. */
export function regionForCluster(cluster: PinCluster): Region {
  const lats = cluster.pins.map((pin) => pin.latitude);
  const lngs = cluster.pins.map((pin) => pin.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max((maxLat - minLat) * 1.6, STREET_LAT_DELTA);
  const lngSpan = Math.max((maxLng - minLng) * 1.6, STREET_LAT_DELTA);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latSpan,
    longitudeDelta: lngSpan,
  };
}

/** True when a cluster still covers enough ground to zoom into. */
export function clusterNeedsZoom(cluster: PinCluster): boolean {
  if (cluster.count < 2) return false;
  const lats = cluster.pins.map((pin) => pin.latitude);
  const lngs = cluster.pins.map((pin) => pin.longitude);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  return latSpan > 0.0004 || lngSpan > 0.0004;
}
