import type { Region } from 'react-native-maps';

import {
  boundsFromRegion,
  radiusKmForBounds,
  tilesForRegion,
} from './mapViewport';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

function region(partial: Partial<Region> & Pick<Region, 'latitudeDelta'>): Region {
  return {
    latitude: 43.65,
    longitude: -79.38,
    longitudeDelta: partial.latitudeDelta,
    ...partial,
  };
}

const neighbourhood = region({ latitudeDelta: 0.05, longitudeDelta: 0.06 });
const city = region({ latitudeDelta: 0.28, longitudeDelta: 0.32 });
const metro = region({ latitudeDelta: 1.1, longitudeDelta: 1.3 });

check('neighbourhood is one tile', tilesForRegion(neighbourhood).length, 1);
check('city view is a 2x2 grid', tilesForRegion(city).length, 4);
check('metro view is a 3x3 grid', tilesForRegion(metro).length, 9);

const cityTiles = tilesForRegion(city);
const cityBounds = boundsFromRegion(city);
const north = Math.max(...cityTiles.map((tile) => tile.north));
const south = Math.min(...cityTiles.map((tile) => tile.south));
const east = Math.max(...cityTiles.map((tile) => tile.east));
const west = Math.min(...cityTiles.map((tile) => tile.west));
check('tiles cover the north edge', Math.abs(north - cityBounds.north) < 1e-9, true);
check('tiles cover the south edge', Math.abs(south - cityBounds.south) < 1e-9, true);
check('tiles cover the east edge', Math.abs(east - cityBounds.east) < 1e-9, true);
check('tiles cover the west edge', Math.abs(west - cityBounds.west) < 1e-9, true);

for (const tile of cityTiles) {
  const centerInside =
    tile.center.lat <= tile.north &&
    tile.center.lat >= tile.south &&
    tile.center.lng <= tile.east &&
    tile.center.lng >= tile.west;
  check('tile centre sits inside the tile', centerInside, true);
  check('tile radius covers the box', tile.radiusKm >= radiusKmForBounds(tile) * 0.99, true);
}

const single = tilesForRegion(neighbourhood)[0];
check(
  'single tile matches the visible bounds',
  {
    north: single.north,
    south: single.south,
    east: single.east,
    west: single.west,
  },
  boundsFromRegion(neighbourhood),
);

console.log('all map viewport checks passed');
