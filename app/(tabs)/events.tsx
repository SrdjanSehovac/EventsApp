import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { regionForCurrentCity, useBrowse, useEnsureMapViewport } from '../../src/browse';
import { findProductCity } from '../../src/config/cities';
import {
  BrowseHeader,
  EventCard,
  FilterSheet,
  SelectField,
  countActiveFilters,
} from '../../src/components';
import {
  useDebouncedValue,
  useInfiniteEvents,
  useUserGeo,
} from '../../src/hooks';
import { useTabBarInset } from '../../src/layout';
import { useTheme } from '../../src/theme';
import type { PublicSortField } from '../../src/types/events';
import { buildAreaListParams, selectAreaEvents } from '../../src/utils/areaQuery';

const SORT_OPTIONS: { label: string; value: PublicSortField }[] = [
  { label: 'Soonest', value: 'starts_at' },
  { label: 'Latest', value: '-starts_at' },
  { label: 'Nearest', value: 'distance' },
  { label: 'Farthest', value: '-distance' },
];

export default function EventsScreen() {
  const { colors, typography, spacing } = useTheme();
  const tabBarInset = useTabBarInset();
  const {
    filters,
    patchFilters,
    sort,
    setSort,
    sortTouched,
    setSortTouched,
    viewport,
    commitViewport,
  } = useBrowse();
  useEnsureMapViewport();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedQ = useDebouncedValue(filters.q);
  const geoQuery = useUserGeo();
  const hasUserGeo = Boolean(geoQuery.data);
  const focusedCity = useMemo(
    () => findProductCity(filters.city),
    [filters.city],
  );
  const areaParams = useMemo(
    () =>
      viewport
        ? buildAreaListParams({ ...filters, q: debouncedQ }, sort, viewport)
        : null,
    [viewport, filters, debouncedQ, sort],
  );
  const areaGeo = viewport
    ? { lat: viewport.latitude, lng: viewport.longitude }
    : null;

  const eventsQuery = useInfiniteEvents(
    areaParams ?? { page_size: 24 },
    areaGeo,
    Boolean(areaParams),
  );

  useEffect(() => {
    if (!sortTouched && hasUserGeo && sort === 'starts_at') {
      setSort('distance');
    }
  }, [hasUserGeo, sort, sortTouched, setSort]);

  const activeFilterCount = countActiveFilters(filters, { excludeQuery: true });
  const area = selectAreaEvents(eventsQuery.data?.pages, viewport);
  const items = area.items;
  const total = area.total;
  const isLoading = !viewport || !geoQuery.isFetched || eventsQuery.isLoading;

  function showAllInArea() {
    patchFilters({ neighbourhood: null });
    commitViewport(
      regionForCurrentCity(filters.city, geoQuery.data),
      'program',
    );
  }
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
            {eventsQuery.data
              ? `${total.toLocaleString()} event${total === 1 ? '' : 's'} in this map area`
              : 'Events in this map area'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              focusedCity ? `Show all in ${focusedCity.name}` : 'Show all nearby'
            }
            onPress={showAllInArea}
            style={styles.showAll}
          >
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '800' }]}>
              {focusedCity ? `Show all in ${focusedCity.name}` : 'Show all nearby'}
            </Text>
          </Pressable>
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
            style={styles.list}
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
                No events in this map area.
              </Text>
            }
            ListFooterComponent={
              eventsQuery.isFetchingNextPage ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={{ marginVertical: spacing.md }}
                />
              ) : null
            }
            onEndReached={() => {
              if (eventsQuery.hasNextPage && !eventsQuery.isFetchingNextPage) {
                void eventsQuery.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.6}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              flexGrow: 0,
              paddingBottom: tabBarInset + 12,
            }}
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
    gap: 4,
  },
  showAll: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
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
  list: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
