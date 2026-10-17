import type { Region } from 'react-native-maps';

import type { EventMapPin, PublicEventListResponse } from '../types/events';
import { countEventsInView } from './areaCount';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

function pin(id: string, latitude: number, longitude: number): EventMapPin {
  return { event_id: id, title: id, latitude, longitude } as EventMapPin;
}

const view: Region = {
  latitude: 43.65,
  longitude: -79.38,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const onScreen = Array.from({ length: 200 }, (_, index) =>
  pin(`e${index}`, 43.65 + (index % 10) * 0.002, -79.38 + Math.floor(index / 10) * 0.002),
);

function listPage(
  items: { event_id: string; latitude: number; longitude: number }[],
  total: number,
  mode: 'default' | 'bbox' = 'default',
): PublicEventListResponse {
  return {
    geo: { mode, source: 'default', lat: 43.65, lng: -79.38 },
    items: items.map((item) => ({
      ...item,
      title: item.event_id,
      source: '',
      source_url: '',
      status: 'active',
      schedule_type: 'one_shot',
    })),
    meta: { page: 1, page_size: items.length, total, total_pages: 1 },
  } as PublicEventListResponse;
}

check(
  'ignored bbox does not shrink the count below the pins',
  countEventsInView({
    pins: onScreen,
    region: view,
    listPages: [
      listPage(
        [
          { event_id: 'only', latitude: 43.65, longitude: -79.38 },
          { event_id: 'far', latitude: 49, longitude: -123 },
        ],
        1330,
      ),
    ],
  }),
  200,
);

check(
  'honoured list total is used when it covers the pins',
  countEventsInView({
    pins: onScreen.slice(0, 10),
    region: view,
    listPages: [listPage(onScreen.slice(0, 10).map((item) => ({
      event_id: item.event_id,
      latitude: item.latitude,
      longitude: item.longitude,
    })), 1330)],
  }),
  1330,
);

check(
  'a tiny reported total cannot undercount visible pins',
  countEventsInView({
    pins: onScreen.slice(0, 40),
    region: view,
    mapTotal: 1,
  }),
  40,
);

check(
  'map total is preferred when the server sends one',
  countEventsInView({
    pins: onScreen,
    region: view,
    mapTotal: 900,
  }),
  900,
);

const inBox = onScreen.slice(0, 20).map((item) => ({
  event_id: item.event_id,
  latitude: item.latitude,
  longitude: item.longitude,
}));

check(
  'bbox total from the map and the list is the in-view count',
  countEventsInView({
    pins: onScreen,
    region: view,
    listPages: [listPage(inBox, 303, 'bbox')],
    mapTotal: 303,
  }),
  303,
);

check(
  'bbox mode still ignores a total when rows fall outside the box',
  countEventsInView({
    pins: onScreen.slice(0, 40),
    region: view,
    listPages: [
      listPage(
        [
          { event_id: 'near', latitude: 43.65, longitude: -79.38 },
          { event_id: 'far', latitude: 49, longitude: -123 },
        ],
        900,
        'bbox',
      ),
    ],
    mapTotal: 40,
  }),
  40,
);

console.log('all area count checks passed');
