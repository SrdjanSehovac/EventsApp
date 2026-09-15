import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  EventCard,
  EventFilters,
  EMPTY_FILTERS,
  SelectField,
  countActiveFilters,
  filtersToParams,
  type EventsFilterState,
} from '../../src/components';
import { SW_ONTARIO_CITIES } from '../../src/config/cities';
import {
  useCategories,
  useCities,
  useDebouncedValue,
  useInfiniteEvents,
  useNeighbourhoods,
  useUserGeo,
} from '../../src/hooks';
import { useResponsive } from '../../src/layout';
import { colorForCategory, tintForCategory, useTheme } from '../../src/theme';
import type { PublicSortField } from '../../src/types/events';

const SORT_OPTIONS: { label: string; value: PublicSortField }[] = [
  { label: 'Sort By: starts_at', value: 'starts_at' },
  { label: 'Sort By: -starts_at', value: '-starts_at' },
  { label: 'Sort By: distance', value: 'distance' },
  { label: 'Sort By: -distance', value: '-distance' },
];

export default function EventsScreen() {
  const { colors, typography, spacing, radius, tabBar } = useTheme();
  const { isPhone, isDesktop, horizontalPadding } = useResponsive();
  const [filters, setFilters] = useState<EventsFilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<PublicSortField>('starts_at');
  const [sortTouched, setSortTouched] = useState(false);
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

  // Prefer nearest-first once location is available, unless the user chose a sort.
  useEffect(() => {
    if (!sortTouched && hasUserGeo && sort === 'starts_at') {
      setSort('distance');
    }
  }, [hasUserGeo, sort, sortTouched]);

  const columns = isDesktop ? 3 : isPhone ? 1 : 2;
  const showSidebar = isDesktop;
  const activeFilterCount = countActiveFilters(filters);
  const bottomClearance = tabBar.height + spacing.lg;

  const items = eventsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = eventsQuery.data?.pages[0]?.meta.total ?? 0;
  const isLoading = !geoQuery.isFetched || eventsQuery.isLoading;
  const error = eventsQuery.error;

  const categories = categoriesQuery.data?.items ?? [];
  const cities = citiesQuery.data ?? [];
  const neighbourhoods = neighbourhoodsQuery.data ?? [];

  const filterProps = {
    value: filters,
    onChange: setFilters,
    categories,
    cities,
    neighbourhoods,
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
                  {hasUserGeo
                    ? "Discover what's happening around you"
                    : "Discover what's happening"}
                  {eventsQuery.data
                    ? hasUserGeo
                      ? ` · ${total} events near you`
                      : ` · ${total} events`
                    : ''}
                </Text>
              </View>

              {showSidebar ? (
                <View style={[styles.headerActions, { gap: spacing.sm }]}>
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
              ) : null}
            </View>

            {!showSidebar ? (
              <View
                style={[
                  styles.headerSearch,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  value={filters.q}
                  onChangeText={(q) => setFilters((prev) => ({ ...prev, q }))}
                  placeholder="Search events..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    typography.body,
                    { color: colors.text, marginLeft: spacing.sm, flex: 1, paddingVertical: 10 },
                  ]}
                />
              </View>
            ) : null}

            <View style={[styles.cityChipRow, { marginTop: spacing.md, gap: spacing.sm }]}>
              {SW_ONTARIO_CITIES.map((city) => {
                const selected = filters.city === city;
                return (
                  <Pressable
                    key={city}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Filter by ${city}`}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        city: selected ? null : city,
                        neighbourhood: null,
                      }))
                    }
                    style={[
                      styles.cityChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: selected ? colors.onPrimary : colors.textSecondary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {city}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!showSidebar && categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: spacing.sm }}
                contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}
              >
                {categories.map((category) => {
                  const selected = filters.categorySlugs.includes(category.slug);
                  const color = colorForCategory(category);
                  return (
                    <Pressable
                      key={category.category_id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Filter by ${category.name}`}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          categorySlugs: prev.categorySlugs.includes(category.slug)
                            ? prev.categorySlugs.filter((slug) => slug !== category.slug)
                            : [...prev.categorySlugs, category.slug],
                        }))
                      }
                      style={[
                        styles.cityChip,
                        {
                          backgroundColor: selected ? color : tintForCategory(category, '22'),
                          borderColor: color,
                          borderRadius: radius.full,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: selected ? '#FFFFFF' : color,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {!showSidebar ? (
              <View
                style={[
                  styles.headerActions,
                  styles.headerActionsPhone,
                  { gap: spacing.sm },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open filters"
                  onPress={() => setFiltersOpen(true)}
                  style={[
                    styles.filterButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Ionicons name="options-outline" size={18} color={colors.text} />
                  {activeFilterCount > 0 ? (
                    <View
                      style={[
                        styles.filterBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.onPrimary,
                          fontSize: 10,
                          fontWeight: '700',
                        }}
                      >
                        {activeFilterCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
                <View style={[styles.sortWrap, styles.sortWrapPhone]}>
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
              key={columns}
              data={items}
              numColumns={columns}
              keyExtractor={(item) => item.event_id}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: `${100 / columns}%`,
                    paddingHorizontal: columns > 1 ? spacing.sm : 0,
                    marginBottom: spacing.lg,
                  }}
                >
                  <EventCard item={item} />
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
                      {
                        borderColor: colors.border,
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
                          { color: colors.text, fontWeight: '600' },
                        ]}
                      >
                        Load More Events
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
              contentContainerStyle={
                columns > 1 ? { marginHorizontal: -spacing.sm } : undefined
              }
            />
          )}
        </View>
      </View>

      <Modal
        visible={filtersOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <SafeAreaView
          style={[styles.safe, { backgroundColor: colors.background }]}
        >
          <KeyboardAvoidingView
            style={styles.safe}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: colors.border,
                  paddingHorizontal: horizontalPadding,
                },
              ]}
            >
              <Text style={[typography.heading, { color: colors.text }]}>
                Filters
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={() => setFiltersOpen(false)}
                hitSlop={8}
              >
                <Text
                  style={[
                    typography.body,
                    { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
                paddingTop: spacing.lg,
                paddingBottom: spacing.xxxl,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <EventFilters {...filterProps} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  cityChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionsPhone: {
    width: '100%',
    marginTop: 12,
  },
  sortWrap: {
    minWidth: 148,
  },
  sortWrapPhone: {
    flex: 1,
    minWidth: 0,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    minHeight: 44,
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
    borderWidth: 1,
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
