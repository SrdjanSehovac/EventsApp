import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SW_ONTARIO_CITIES } from '../config/cities';
import { useTheme } from '../theme';
import type { CategoryNode } from '../types/categories';
import type {
  CityCount,
  MapEventsParams,
  NeighbourhoodCount,
  PublicEventListParams,
  PublicSortField,
  Ticketing,
  WhenPreset,
} from '../types/events';
import {
  FILTER_CATEGORY_GROUPS,
  countSelectedFilterGroups,
  expandSelectedCategorySlugs,
  isFilterGroupSelected,
  toggleFilterGroup,
} from '../utils/filterCategories';
import { SelectField } from './SelectField';

export type EventsFilterState = {
  q: string;
  categorySlugs: string[];
  city: string | null;
  neighbourhood: string | null;
  when: WhenPreset;
  startsAfter: string;
  startsBefore: string;
  ticketing: Extract<Ticketing, 'free' | 'rsvp' | 'ticketed'> | null;
  indoor: boolean;
  outdoor: boolean;
};

export const EMPTY_FILTERS: EventsFilterState = {
  q: '',
  categorySlugs: [],
  city: null,
  neighbourhood: null,
  when: 'upcoming',
  startsAfter: '',
  startsBefore: '',
  ticketing: null,
  indoor: false,
  outdoor: false,
};

const TICKETING_OPTIONS: { label: string; value: NonNullable<EventsFilterState['ticketing']> }[] =
  [
    { label: 'Free', value: 'free' },
    { label: 'RSVP', value: 'rsvp' },
    { label: 'Ticketed', value: 'ticketed' },
  ];

export const WHEN_OPTIONS: { label: string; value: WhenPreset }[] = [
  { label: 'Now', value: 'now' },
  { label: 'Today', value: 'today' },
  { label: 'Tonight', value: 'tonight' },
  { label: 'Weekend', value: 'weekend' },
  { label: 'Upcoming', value: 'upcoming' },
];

type EventFiltersProps = {
  value: EventsFilterState;
  onChange: (next: EventsFilterState) => void;
  /** API tree used only to expand group → slugs. Never rendered as filter rows. */
  categoryTree?: CategoryNode[];
  cities: CityCount[];
  neighbourhoods: NeighbourhoodCount[];
  showSearch?: boolean;
  showClear?: boolean;
};

function toIsoDate(raw: string, endOfDay: boolean) {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  let iso: string | undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    iso = trimmed;
  } else {
    const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      iso = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
  }

  if (!iso) return undefined;
  return endOfDay ? `${iso}T23:59:59` : `${iso}T00:00:00`;
}

function categoryQuerySlugs(
  filters: EventsFilterState,
  tree: CategoryNode[] = [],
): string[] | undefined {
  const slugs = expandSelectedCategorySlugs(filters.categorySlugs, tree);
  return slugs.length > 0 ? slugs : undefined;
}

export function filtersToParams(
  filters: EventsFilterState,
  sort: PublicSortField,
  options?: { localizeNearUser?: boolean; categories?: CategoryNode[] },
): Omit<PublicEventListParams, 'page'> {
  const startsAfter = toIsoDate(filters.startsAfter, false);
  const startsBefore = toIsoDate(filters.startsBefore, true);
  const hasDateRange = Boolean(startsAfter || startsBefore);
  const hasCity = Boolean(filters.city);

  let setting: PublicEventListParams['setting'];
  if (filters.indoor && !filters.outdoor) setting = 'indoor';
  else if (filters.outdoor && !filters.indoor) setting = 'outdoor';

  return {
    page_size: 12,
    q: filters.q.trim() || undefined,
    categories: categoryQuerySlugs(filters, options?.categories),
    city: filters.city ?? undefined,
    neighbourhood: filters.neighbourhood ?? undefined,
    starts_after: startsAfter,
    starts_before: startsBefore,
    ticketing: filters.ticketing ?? undefined,
    setting,
    sort,
    when: hasDateRange ? undefined : filters.when,
    radius_km:
      options?.localizeNearUser && !hasCity ? NEARBY_RADIUS_KM : undefined,
  };
}

export function filtersToMapParams(
  filters: EventsFilterState,
  options?: { categories?: CategoryNode[] },
): Pick<
  MapEventsParams,
  'city' | 'categories' | 'is_free' | 'when' | 'starts_after' | 'starts_before'
> {
  const startsAfter = toIsoDate(filters.startsAfter, false);
  const startsBefore = toIsoDate(filters.startsBefore, true);
  const hasDateRange = Boolean(startsAfter || startsBefore);

  return {
    city: filters.city ?? undefined,
    categories: categoryQuerySlugs(filters, options?.categories),
    is_free: filters.ticketing === 'free' ? true : undefined,
    starts_after: startsAfter,
    starts_before: startsBefore,
    when: hasDateRange ? undefined : filters.when,
  };
}

/** Matches server map default so list + map stay in the same area. */
const NEARBY_RADIUS_KM = 25;

export function countActiveFilters(
  filters: EventsFilterState,
  options?: { excludeQuery?: boolean },
) {
  let count = 0;
  if (!options?.excludeQuery && filters.q.trim()) count += 1;
  count += countSelectedFilterGroups(filters.categorySlugs);
  if (filters.city) count += 1;
  if (filters.neighbourhood) count += 1;
  if (filters.when !== EMPTY_FILTERS.when) count += 1;
  if (filters.startsAfter.trim()) count += 1;
  if (filters.startsBefore.trim()) count += 1;
  if (filters.ticketing) count += 1;
  if (filters.indoor !== filters.outdoor) count += 1;
  return count;
}

export function EventFilters({
  value,
  onChange,
  categoryTree = [],
  cities,
  neighbourhoods,
  showSearch = true,
  showClear = true,
}: EventFiltersProps) {
  const { colors, typography, spacing, radius } = useTheme();

  function patch(partial: Partial<EventsFilterState>) {
    onChange({ ...value, ...partial });
  }

  const apiByName = new Map(
    cities.map((city) => [city.city.toLowerCase(), city] as const),
  );
  const cityOptions = [
    { label: 'Any', value: null },
    ...SW_ONTARIO_CITIES.map((name) => {
      const match = apiByName.get(name.toLowerCase());
      return {
        label: name,
        value: match?.city ?? name,
      };
    }),
  ];

  const neighbourhoodOptions = [
    { label: 'Any', value: null },
    ...neighbourhoods.map((item) => ({
      label: item.neighbourhood,
      value: item.neighbourhood,
    })),
  ];

  const sectionLabel = [
    typography.caption,
    {
      color: colors.textMuted,
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
    },
  ];

  return (
    <View>
      {showClear ? (
        <View style={[styles.headerRow, { marginBottom: spacing.md }]}>
          <Text style={sectionLabel}>Filters</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            onPress={() => onChange({ ...EMPTY_FILTERS, q: value.q })}
            hitSlop={8}
          >
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              Reset
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showSearch ? (
        <View
          style={[
            styles.search,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={value.q}
            onChangeText={(q) => patch({ q })}
            placeholder="Search events…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              typography.body,
              styles.searchInput,
              { color: colors.text, marginLeft: spacing.sm },
            ]}
          />
        </View>
      ) : null}

      <Text style={sectionLabel}>When</Text>
      <View style={[styles.pillRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
        {WHEN_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={value.when === option.value}
            onPress={() => patch({ when: option.value })}
          />
        ))}
      </View>

      <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
        <SelectField
          icon="business-outline"
          label="City"
          placeholder="Any"
          value={value.city}
          options={cityOptions}
          onChange={(city) => patch({ city, neighbourhood: null })}
        />
        <SelectField
          icon="location-outline"
          label="Neighbourhood"
          placeholder="Any"
          value={value.neighbourhood}
          options={neighbourhoodOptions}
          onChange={(neighbourhood) => patch({ neighbourhood })}
        />
      </View>

      <Text style={sectionLabel}>Category</Text>
      <View style={[styles.pillRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
        {FILTER_CATEGORY_GROUPS.map((group) => {
          const selected = isFilterGroupSelected(value.categorySlugs, group);
          return (
            <FilterChip
              key={group.id}
              label={group.label}
              selected={selected}
              onPress={() =>
                patch({
                  categorySlugs: toggleFilterGroup(
                    value.categorySlugs,
                    group,
                    categoryTree,
                  ),
                })
              }
            />
          );
        })}
      </View>

      <Text style={sectionLabel}>Ticketing</Text>
      <View style={[styles.pillRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
        {TICKETING_OPTIONS.map((option) => {
          const selected = value.ticketing === option.value;
          return (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={selected}
              onPress={() => patch({ ticketing: selected ? null : option.value })}
            />
          );
        })}
      </View>

      <Text style={sectionLabel}>Date range</Text>
      <View style={[styles.dateRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
        <DateInput
          value={value.startsAfter}
          placeholder="From"
          onChange={(startsAfter) => patch({ startsAfter })}
        />
        <DateInput
          value={value.startsBefore}
          placeholder="To"
          onChange={(startsBefore) => patch({ startsBefore })}
        />
      </View>

      <Text style={sectionLabel}>Indoor / Outdoor</Text>
      <View style={[styles.pillRow, { gap: spacing.sm }]}>
        <FilterChip
          label="Indoor"
          selected={value.indoor}
          onPress={() => patch({ indoor: !value.indoor })}
        />
        <FilterChip
          label="Outdoor"
          selected={value.outdoor}
          onPress={() => patch({ outdoor: !value.outdoor })}
        />
      </View>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.pill,
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
        {label}
      </Text>
    </Pressable>
  );
}

function DateInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.dateField,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      <Ionicons name="calendar-outline" size={14} color={colors.primary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          typography.caption,
          { color: colors.text, marginLeft: spacing.sm, flex: 1, paddingVertical: spacing.md },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
