import type { Region } from 'react-native-maps';

import type { EventMapPin } from '../types/events';
import { STREET_ZOOM, zoomBucket } from './mapViewport';
import { clusterPins, regionForCluster } from './clusterPins';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

function pin(id: string, latitude: number, longitude: number): EventMapPin {
  return {
    event_id: id,
    title: id,
    latitude,
    longitude,
  } as EventMapPin;
}

function region(partial: Partial<Region> & Pick<Region, 'latitudeDelta'>): Region {
  return {
    latitude: 43.65,
    longitude: -79.38,
    longitudeDelta: partial.latitudeDelta,
    ...partial,
  };
}

const pins = [
  pin('a', 43.65, -79.38),
  pin('b', 43.652, -79.382),
  pin('c', 43.8, -79.55),
];

const wide = region({ latitudeDelta: 0.4, longitudeDelta: 0.4 });
const panned = { ...wide, latitude: 43.7, longitude: -79.3 };
const street = region({ latitudeDelta: 0.004, longitudeDelta: 0.004 });

const wideIds = clusterPins(pins, wide).map((cluster) => cluster.id).sort();
const pannedIds = clusterPins(pins, panned).map((cluster) => cluster.id).sort();

check('same zoom bucket after a pan', zoomBucket(wide), zoomBucket(panned));
check('pan does not change cluster ids', pannedIds, wideIds);
check('street zoom is at least the street bucket', zoomBucket(street) >= STREET_ZOOM, true);
check(
  'street zoom splits into individual pins',
  clusterPins(pins, street).every((cluster) => cluster.count === 1),
  true,
);

const tight = clusterPins(
  [pin('a', 43.65, -79.38), pin('b', 43.6502, -79.3802)],
  wide,
).find((cluster) => cluster.count > 1);

if (!tight) {
  throw new Error('expected a cluster at city zoom');
}
const fitted = regionForCluster(tight);
check(
  'cluster tap reaches street zoom',
  zoomBucket(fitted) >= STREET_ZOOM,
  true,
);

console.log('all cluster checks passed');
