import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
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
  type BrowseSearchBarHandle,
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
import {
  buildAreaListParams,
  countEventsInView,
  pinMatchesQuery,
  selectAreaEvents,
} from '../../src/utils/areaQuery';
import { pinToListItem } from '../../src/utils/eventDetail';
import { withEndedLast } from '../../src/utils/eventLive';
import { friendlyPublicError } from '../../src/utils/publicError';
import { DEFAULT_LIST_SORT, orderBySoonest } from '../../src/utils/listSort';
import { boundsFromRegion, pinInsideBounds } from '../../src/utils/mapViewport';

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
    setSortTouched,
    viewport,
    commitViewport,
    loadedPins,
    mapBoxTotal,
  } = useBrowse();
  useEnsureMapViewport();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const searchRef = useRef<BrowseSearchBarHandle>(null);

  const debouncedQ = useDebouncedValue(filters.q);
  const geoQuery = useUserGeo();
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

  const activeFilterCount = countActiveFilters(filters, { excludeQuery: true });
  const visiblePins = useMemo(
    () => loadedPins.filter((pin) => pinMatchesQuery(pin, debouncedQ)),
    [loadedPins, debouncedQ],
  );
  const area = useMemo(
    () => selectAreaEvents(eventsQuery.data?.pages, viewport),
    [eventsQuery.data?.pages, viewport],
  );
  const total = countEventsInView({
    pins: visiblePins,
    region: viewport,
    listPages: eventsQuery.data?.pages,
    mapTotal: mapBoxTotal,
  });
  const items = useMemo(() => {
    if (!viewport) return [];
    let ordered = area.items;
    if (!area.honoured) {
      const bounds = boundsFromRegion(viewport);
      const byId = new Map(area.items.map((item) => [item.event_id, item]));
      for (const pin of visiblePins) {
        if (!pinInsideBounds(pin, bounds) || byId.has(pin.event_id)) continue;
        byId.set(pin.event_id, pinToListItem(pin));
      }
      const merged = [...byId.values()];
      ordered = sort === DEFAULT_LIST_SORT ? orderBySoonest(merged) : merged;
    }
    return withEndedLast(ordered);
  }, [area.honoured, area.items, visiblePins, viewport, sort]);
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
        ref={searchRef}
        value={filters.q}
        onChangeText={(q) => patchFilters({ q })}
        onPressFilters={() => setFiltersOpen(true)}
        onActiveChange={setSearchActive}
        filterCount={activeFilterCount}
      />
      <View
        style={[styles.listPane, { backgroundColor: colors.background }]}
        onTouchStart={() => {
          if (!searchActive) return;
          searchRef.current?.close();
          Keyboard.dismiss();
        }}
      >
        <View style={styles.listMeta}>
          {searchActive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss search"
              onPressIn={() => searchRef.current?.close()}
              style={styles.dismissMeta}
            />
          ) : null}
          <Text
            style={[
              typography.heading,
              { color: colors.text, fontSize: 18 },
            ]}
          >
            {total > 0 || eventsQuery.data
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
                  setSort((value as PublicSortField) ?? DEFAULT_LIST_SORT);
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
            {friendlyPublicError(
              error,
              "Can't load events right now. Check your connection and try again.",
            )}
          </Text>
        ) : (
          <FlatList
            style={styles.list}
            data={items}
            keyExtractor={(item) => item.event_id}
            renderItem={({ item }) => (
              <EventCard item={item} variant="listing" pressDisabled={searchActive} />
            )}
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
              if (!area.honoured) return;
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
            keyboardShouldPersistTaps="never"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={() => {
              searchRef.current?.close();
              Keyboard.dismiss();
            }}
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
    position: 'relative',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 4,
  },
  dismissMeta: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.01)',
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
