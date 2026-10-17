import type { PublicSortField } from '../types/events';

/** List order for upcoming events: start time, earliest first. */
export const DEFAULT_LIST_SORT: PublicSortField = 'starts_at';

export const LIST_SORT_STORAGE_KEY = 'eventsapp.prefs.listSort';
export const LIST_SORT_MIGRATED_KEY = 'eventsapp.prefs.listSortMigrated';

/**
 * Names an older build might have used. None of these are written anymore.
 * The one-time migration still checks them so a saved Nearest (or anything else)
 * does not come back as the selected sort.
 */
export const LEGACY_LIST_SORT_KEYS = [
  'eventsapp.prefs.sort',
  'eventsapp.sort',
  'eventsapp.listSort',
  'eventsapp.prefs.list-sort',
  '@eventsapp/listSort',
] as const;

const PUBLIC_SORTS = new Set<string>([
  'starts_at',
  '-starts_at',
  'distance',
  '-distance',
]);

export function isPublicSortField(value: string | null | undefined): value is PublicSortField {
  return typeof value === 'string' && PUBLIC_SORTS.has(value);
}

export type ListSortSnapshot = {
  migrated: string | null;
  stored: string | null;
  legacy: Array<string | null>;
};

export type ResolvedListSort = {
  sort: PublicSortField;
  /** False until this build has forced Soonest once. */
  alreadyMigrated: boolean;
};

/**
 * Fresh installs and the first launch after this build start on Soonest.
 * A sort saved by an older build is replaced once. After that, the stored
 * value is the user's choice.
 */
export function resolveListSortPreference(snapshot: ListSortSnapshot): ResolvedListSort {
  if (snapshot.migrated === '1') {
    return {
      sort: isPublicSortField(snapshot.stored) ? snapshot.stored : DEFAULT_LIST_SORT,
      alreadyMigrated: true,
    };
  }
  return {
    sort: DEFAULT_LIST_SORT,
    alreadyMigrated: false,
  };
}

export function startTimeMs(startsAt: string | null | undefined): number {
  if (!startsAt) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(startsAt);
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

/** Soonest: upcoming events by start time, earliest first. Missing times last. */
export function orderBySoonest<T extends { starts_at?: string | null }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => startTimeMs(a.starts_at) - startTimeMs(b.starts_at));
}
