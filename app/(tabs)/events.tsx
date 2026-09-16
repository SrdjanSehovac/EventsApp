import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBrowse } from '../../src/browse';
import {
  BrowseSearchBar,
  EventCard,
  EventFilters,
  FilterSheet,
  MapListToggle,
  SelectField,
  countActiveFilters,
  filtersToParams,
} from '../../src/components';
import {
  useCategories,
  useCities,
  useDebouncedValue,
  useInfiniteEvents,
  useNeighbourhoods,
  useUserGeo,
} from '../../src/hooks';
import { useResponsive } from '../../src/layout';
import { useTheme } from '../../src/theme';
import type { PublicSortField } from '../../src/types/events';

const SORT_OPTIONS: { label: string; value: PublicSortField }[] = [
  { label: 'Soonest', value: 'starts_at' },
  { label: 'Latest', value: '-starts_at' },
  { label: 'Nearest', value: 'distance' },
  { label: 'Farthest', value: '-distance' },
];

export default function EventsScreen() {
  const { colors, typography, spacing, radius, tabBar, shadows } = useTheme();
  const { isPhone, isDesktop, horizontalPadding } = useResponsive();
  const {
    filters,
    setFilters,
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

  const categoriesQuery = useCategories();
  const citiesQuery = useCities();
  const neighbourhoodsQuery = useNeighbourhoods(
    { city: filters.city ?? undefined },
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

  const showSidebar = isDesktop;
  const activeFilterCount = countActiveFilters(filters, { excludeQuery: true });
  const bottomClearance = tabBar.height + 80;

  const items = eventsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = eventsQuery.data?.pages[0]?.meta.total ?? 0;
  const isLoading = !geoQuery.isFetched || eventsQuery.isLoading;
  const error = eventsQuery.error;

  const filterProps = {
    value: filters,
    onChange: setFilters,
    categories: categoriesQuery.data?.items ?? [],
    cities: citiesQuery.data ?? [],
    neighbourhoods: neighbourhoodsQuery.data ?? [],
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.body,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomClearance,
          },
        ]}
      >
        {showSidebar ? (
          <ScrollView
            style={[
              styles.sidebar,
              {
                borderRightColor: colors.border,
                paddingRight: spacing.lg,
                marginRight: spacing.lg,
              },
            ]}
            contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxl }}
            showsVerticalScrollIndicator={false}
          >
            <EventFilters {...filterProps} />
          </ScrollView>
        ) : null}

        <View style={styles.main}>
          <View style={{ paddingTop: spacing.md, marginBottom: spacing.md }}>
            {!showSidebar ? (
              <BrowseSearchBar
                value={filters.q}
                onChangeText={(q) => patchFilters({ q })}
                onPressFilters={() => setFiltersOpen(true)}
                filterCount={activeFilterCount}
              />
            ) : (
              <View style={styles.titleRow}>
                <View style={styles.titleBlock}>
                  <Text style={[typography.title, { color: colors.text }]}>
                    Events
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, marginTop: spacing.xs },
                    ]}
                  >
                    {eventsQuery.data
                      ? `${total} listing${total === 1 ? '' : 's'}`
                      : 'Browse events'}
                  </Text>
                </View>
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
            )}

            {!showSidebar ? (
              <View
                style={[
                  styles.listMeta,
                  { marginTop: spacing.md, gap: spacing.sm },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textSecondary,
                      fontWeight: '700',
                      flex: 1,
                    },
                  ]}
                >
                  {eventsQuery.data
                    ? `${total} event${total === 1 ? '' : 's'}`
                    : 'Searching nearby events'}
                </Text>
                <View style={styles.sortWrapPhone}>
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
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <Text style={[typography.body, { color: colors.danger }]}>
              {error instanceof Error ? error.message : 'Failed to load events'}
            </Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.event_id}
              renderItem={({ item }) => (
                <View style={{ marginBottom: spacing.md }}>
                  <EventCard item={item} variant={isPhone ? 'listing' : 'card'} />
                </View>
              )}
              ListEmptyComponent={
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  No upcoming events found.
                </Text>
              }
              ListFooterComponent={
                eventsQuery.hasNextPage ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Load more events"
                    onPress={() => eventsQuery.fetchNextPage()}
                    disabled={eventsQuery.isFetchingNextPage}
                    style={[
                      styles.loadMore,
                      shadows.soft,
                      {
                        backgroundColor: colors.surface,
                        borderRadius: radius.full,
                        marginBottom: spacing.xl,
                      },
                    ]}
                  >
                    {eventsQuery.isFetchingNextPage ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Text
                        style={[
                          typography.body,
                          { color: colors.text, fontWeight: '700' },
                        ]}
                      >
                        Load more
                      </Text>
                    )}
                  </Pressable>
                ) : items.length > 0 ? (
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: colors.textMuted,
                        textAlign: 'center',
                        marginBottom: spacing.xl,
                      },
                    ]}
                  >
                    Showing {items.length} of {total}
                  </Text>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>

      <MapListToggle bottomOffset={tabBar.height + spacing.sm} />
      <FilterSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'center',
  },
  sidebar: {
    width: 280,
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortWrap: {
    minWidth: 132,
  },
  sortWrapPhone: {
    minWidth: 120,
    maxWidth: 160,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMore: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 8,
  },
});
