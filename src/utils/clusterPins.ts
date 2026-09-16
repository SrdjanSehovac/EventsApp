import type { Region } from 'react-native-maps';

import type { EventMapPin } from '../types/events';

export type PinCluster = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  pins: EventMapPin[];
};

/** Zoomed-in enough that individual pins stay separate. */
const CLUSTER_DELTA = 0.03;

export function clusterPins(
  pins: EventMapPin[],
  region: Region | null,
): PinCluster[] {
  if (!region || region.latitudeDelta < CLUSTER_DELTA) {
    return pins.map((pin) => ({
      id: pin.event_id,
      latitude: pin.latitude,
      longitude: pin.longitude,
      count: 1,
      pins: [pin],
    }));
  }

  const latCell = Math.max(region.latitudeDelta / 9, 0.008);
  const lngCell = Math.max(region.longitudeDelta / 9, 0.008);
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

  return [...buckets.values()].map((group) => {
    if (group.length === 1) {
      const pin = group[0];
      return {
        id: pin.event_id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        count: 1,
        pins: group,
      };
    }

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
  });
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
