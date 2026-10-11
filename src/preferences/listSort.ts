import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PublicSortField } from '../types/events';
import {
  DEFAULT_LIST_SORT,
  LEGACY_LIST_SORT_KEYS,
  LIST_SORT_MIGRATED_KEY,
  LIST_SORT_STORAGE_KEY,
  resolveListSortPreference,
} from '../utils/listSort';

export async function loadListSort(): Promise<PublicSortField> {
  try {
    const pairs = await AsyncStorage.multiGet([
      LIST_SORT_MIGRATED_KEY,
      LIST_SORT_STORAGE_KEY,
      ...LEGACY_LIST_SORT_KEYS,
    ]);
    const byKey = new Map(pairs);
    const legacy = LEGACY_LIST_SORT_KEYS.map((key) => byKey.get(key) ?? null);
    const resolved = resolveListSortPreference({
      migrated: byKey.get(LIST_SORT_MIGRATED_KEY) ?? null,
      stored: byKey.get(LIST_SORT_STORAGE_KEY) ?? null,
      legacy,
    });
    if (!resolved.alreadyMigrated) {
      await AsyncStorage.multiSet([
        [LIST_SORT_MIGRATED_KEY, '1'],
        [LIST_SORT_STORAGE_KEY, DEFAULT_LIST_SORT],
      ]);
      const stale = LEGACY_LIST_SORT_KEYS.filter((key, index) => legacy[index] != null);
      if (stale.length > 0) await AsyncStorage.multiRemove(stale);
    }
    return resolved.sort;
  } catch {
    return DEFAULT_LIST_SORT;
  }
}

export async function saveListSort(sort: PublicSortField): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [LIST_SORT_MIGRATED_KEY, '1'],
      [LIST_SORT_STORAGE_KEY, sort],
    ]);
  } catch {
    // private mode / disabled storage
  }
}
