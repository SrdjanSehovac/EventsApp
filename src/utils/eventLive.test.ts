import {
  eventPhase,
  isEventLive,
  OPEN_EVENT_MS,
  withEndedLast,
} from './eventLive';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

const hike = {
  starts_at: '2026-10-10T13:00:00Z',
  ends_at: '2026-10-10T15:00:00Z',
};
const viewedSunday = Date.parse('2026-10-11T20:51:00Z');

check(
  'Saturday 9–11 AM hike has ended by Sunday afternoon',
  eventPhase(hike, viewedSunday),
  'ended',
);
check(
  'ended events sort after ones still ahead, keeping each group order',
  withEndedLast(
    [
      { event_id: 'sat', ...hike },
      {
        event_id: 'live',
        starts_at: '2026-10-11T18:00:00Z',
        ends_at: '2026-10-11T22:00:00Z',
      },
      {
        event_id: 'sun',
        starts_at: '2026-10-11T22:00:00Z',
        ends_at: '2026-10-12T01:00:00Z',
      },
      {
        event_id: 'earlier',
        starts_at: '2026-10-10T15:00:00Z',
        ends_at: '2026-10-10T17:00:00Z',
      },
    ],
    viewedSunday,
  ).map((item) => item.event_id),
  ['live', 'sun', 'sat', 'earlier'],
);

check(
  'a later end is still in progress',
  eventPhase(
    { starts_at: '2026-10-11T13:00:00Z', ends_at: '2026-10-11T18:00:00Z' },
    Date.parse('2026-10-11T16:00:00Z'),
  ),
  'live',
);

check(
  'missing ends_at stays live inside three hours',
  isEventLive(
    { starts_at: '2026-10-11T13:00:00Z', ends_at: null },
    Date.parse('2026-10-11T13:00:00Z') + OPEN_EVENT_MS - 60_000,
  ),
  true,
);

check(
  'missing ends_at ends after about three hours',
  eventPhase(
    { starts_at: '2026-10-11T13:00:00Z', ends_at: null },
    Date.parse('2026-10-11T13:00:00Z') + OPEN_EVENT_MS,
  ),
  'ended',
);

check(
  'future start is upcoming',
  eventPhase(
    { starts_at: '2026-10-12T13:00:00Z', ends_at: '2026-10-12T15:00:00Z' },
    Date.parse('2026-10-11T20:51:00Z'),
  ),
  'upcoming',
);

const duringLocalDay = new Date(2026, 9, 10, 15, 0, 0).getTime();
const nextLocalDay = new Date(2026, 9, 11, 0, 30, 0).getTime();
check(
  'date-only event is still on during that local day',
  eventPhase({ starts_at: '2026-10-10', ends_at: null }, duringLocalDay),
  'live',
);
check(
  'date-only event has ended the next local day',
  eventPhase({ starts_at: '2026-10-10', ends_at: null }, nextLocalDay),
  'ended',
);

check(
  'a later occurrence keeps a past first slot upcoming',
  eventPhase(
    {
      starts_at: '2026-10-10T13:00:00Z',
      ends_at: '2026-10-10T15:00:00Z',
      occurrences: [
        { starts_at: '2026-10-10T13:00:00Z', ends_at: '2026-10-10T15:00:00Z' },
        { starts_at: '2026-10-18T13:00:00Z', ends_at: '2026-10-18T15:00:00Z' },
      ],
    },
    viewedSunday,
  ),
  'upcoming',
);

