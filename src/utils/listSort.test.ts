import {
  DEFAULT_LIST_SORT,
  orderBySoonest,
  resolveListSortPreference,
} from './listSort';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

check(
  'fresh install starts on Soonest',
  resolveListSortPreference({ migrated: null, stored: null, legacy: [null] }),
  { sort: 'starts_at', alreadyMigrated: false },
);

check(
  'a saved Nearest from an older build migrates to Soonest once',
  resolveListSortPreference({
    migrated: null,
    stored: 'distance',
    legacy: ['distance', '-starts_at'],
  }),
  { sort: DEFAULT_LIST_SORT, alreadyMigrated: false },
);

check(
  'after migration a user choice is kept',
  resolveListSortPreference({
    migrated: '1',
    stored: '-starts_at',
    legacy: ['distance'],
  }),
  { sort: '-starts_at', alreadyMigrated: true },
);

check(
  'a migrated install with no saved sort stays on Soonest',
  resolveListSortPreference({ migrated: '1', stored: null, legacy: [] }),
  { sort: 'starts_at', alreadyMigrated: true },
);

check(
  'an unknown stored value falls back to Soonest',
  resolveListSortPreference({ migrated: '1', stored: 'created_at', legacy: [] }),
  { sort: 'starts_at', alreadyMigrated: true },
);

check(
  'Soonest orders upcoming events by start time ascending',
  orderBySoonest([
    { event_id: 'late', starts_at: '2026-10-12T18:00:00Z' },
    { event_id: 'none', starts_at: null },
    { event_id: 'early', starts_at: '2026-10-11T13:00:00Z' },
    { event_id: 'mid', starts_at: '2026-10-11T16:00:00Z' },
  ]).map((item) => item.event_id),
  ['early', 'mid', 'late', 'none'],
);
