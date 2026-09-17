import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useBrowse } from '../../src/browse';
import {
  BrowseHeader,
  EventCard,
  FilterSheet,
  SelectField,
  countActiveFilters,
  filtersToParams,
} from '../../src/components';
import {
  useDebouncedValue,
  useInfiniteEvents,
  useUserGeo,
} from '../../src/hooks';
import { useTheme } from '../../src/theme';
import type { PublicSortField } from '../../src/types/events';

const SORT_OPTIONS: { label: string; value: PublicSortField }[] = [
  { label: 'Soonest', value: 'starts_at' },
  { label: 'Latest', value: '-starts_at' },
  { label: 'Nearest', value: 'distance' },
  { label: 'Farthest', value: '-distance' },
];

export default function EventsScreen() {
  const { colors, typography, spacing, tabBar } = useTheme();
  const {
    filters,
    patchFilters,
    sort,
    setSort,
    sortTouched,
    setSortTouched,
  } = useBrowse();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedQ = useDebouncedValue(filters.q);
  const geoQuery = useUserGeo();
  const hasUserGeo = Boolean(geoQuery.data);
  const params = useMemo(
    () =>
      filtersToParams({ ...filters, q: debouncedQ }, sort, {
        localizeNearUser: hasUserGeo,
      }),
    [filters, debouncedQ, sort, hasUserGeo],
  );

  const eventsQuery = useInfiniteEvents(
    params,
    geoQuery.data ?? null,
    geoQuery.isFetched,
  );

  useEffect(() => {
    if (!sortTouched && hasUserGeo && sort === 'starts_at') {
      setSort('distance');
    }
  }, [hasUserGeo, sort, sortTouched, setSort]);

  const activeFilterCount = countActiveFilters(filters, { excludeQuery: true });
  const items = eventsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = eventsQuery.data?.pages[0]?.meta.total ?? 0;
  const isLoading = !geoQuery.isFetched || eventsQuery.isLoading;
  const error = eventsQuery.error;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <BrowseHeader
        value={filters.q}
        onChangeText={(q) => patchFilters({ q })}
        onPressFilters={() => setFiltersOpen(true)}
        filterCount={activeFilterCount}
      />
      <View style={[styles.listPane, { backgroundColor: colors.background }]}>
        <View style={styles.listMeta}>
          <Text
            style={[
              typography.heading,
              { color: colors.text, fontSize: 18 },
            ]}
          >
            {eventsQuery.data ? `${total.toLocaleString()} nearby` : 'Nearby events'}
          </Text>
          <View style={styles.sortRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Sort
            </Text>
            <View style={styles.sortWrap}>
              <SelectField
                compact
                value={sort}
                options={SORT_OPTIONS}
                onChange={(value) => {
                  setSortTouched(true);
                  setSort((value as PublicSortField) ?? 'starts_at');
                }}
              />
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={[typography.body, { color: colors.danger, padding: spacing.md }]}>
            {error instanceof Error ? error.message : 'Failed to load events'}
          </Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.event_id}
            renderItem={({ item }) => <EventCard item={item} variant="listing" />}
            ListEmptyComponent={
              <Text
                style={[
                  typography.body,
                  { color: colors.textMuted, padding: spacing.lg },
                ]}
              >
                No upcoming events found.
              </Text>
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: tabBar.height + 12 }}
          />
        )}
      </View>
      <FilterSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listPane: {
    flex: 1,
    minWidth: 0,
  },
  listMeta: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortWrap: {
    flex: 1,
    minWidth: 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
