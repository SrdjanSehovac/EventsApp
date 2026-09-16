import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
import { SW_ONTARIO_CITIES } from '../config/cities';
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
  categories: CategoryNode[];
  cities: CityCount[];
  neighbourhoods: NeighbourhoodCount[];
  showSearch?: boolean;
  showClear?: boolean;
};

function toggleSlug(slugs: string[], slug: string) {
  return slugs.includes(slug)
    ? slugs.filter((item) => item !== slug)
    : [...slugs, slug];
}

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

export function filtersToParams(
  filters: EventsFilterState,
  sort: PublicSortField,
  options?: { localizeNearUser?: boolean },
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
    categories:
      filters.categorySlugs.length > 0 ? filters.categorySlugs : undefined,
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
): Pick<
  MapEventsParams,
  'city' | 'categories' | 'is_free' | 'when' | 'starts_after' | 'starts_before'
> {
  const startsAfter = toIsoDate(filters.startsAfter, false);
  const startsBefore = toIsoDate(filters.startsBefore, true);
  const hasDateRange = Boolean(startsAfter || startsBefore);

  return {
    city: filters.city ?? undefined,
    categories:
      filters.categorySlugs.length > 0 ? filters.categorySlugs : undefined,
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
  count += filters.categorySlugs.length;
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
  categories,
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
  const pinnedCityOptions = SW_ONTARIO_CITIES.map((name) => {
    const match = apiByName.get(name.toLowerCase());
    return {
      label: match?.city ?? name,
      value: match?.city ?? name,
    };
  });
  const otherCityOptions = cities
    .filter(
      (city) =>
        !SW_ONTARIO_CITIES.some((name) => name.toLowerCase() === city.city.toLowerCase()),
    )
    .map((city) => ({
      label: city.city,
      value: city.city,
    }));
  const cityOptions = [
    { label: 'Any city', value: null },
    ...pinnedCityOptions,
    ...otherCityOptions,
  ];

  const neighbourhoodOptions = [
    { label: 'Any neighbourhood', value: null },
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
          <Text style={sectionLabel}>Refine</Text>
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
              marginBottom: spacing.xl,
            },
          ]}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={value.q}
            onChangeText={(q) => patch({ q })}
            placeholder="Search events, neighbourhoods…"
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
      <View style={[styles.pillRow, { marginBottom: spacing.xl, gap: spacing.sm }]}>
        {WHEN_OPTIONS.map((option) => {
          const selected = value.when === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => patch({ when: option.value })}
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
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={sectionLabel}>City</Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
        <SelectField
          icon="business-outline"
          value={value.city}
          options={cityOptions}
          onChange={(city) => patch({ city, neighbourhood: null })}
        />
        <SelectField
          icon="location-outline"
          value={value.neighbourhood}
          options={neighbourhoodOptions}
          onChange={(neighbourhood) => patch({ neighbourhood })}
        />
      </View>

      <Text style={sectionLabel}>Category</Text>
      <View style={{ marginBottom: spacing.xl }}>
        {categories.map((category) => {
          const checked = value.categorySlugs.includes(category.slug);
          return (
            <Pressable
              key={category.category_id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() =>
                patch({ categorySlugs: toggleSlug(value.categorySlugs, category.slug) })
              }
              style={[styles.checkRow, { paddingVertical: spacing.sm }]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: checked ? colors.primary : colors.border,
                    backgroundColor: checked ? colors.primary : 'transparent',
                    borderRadius: 4,
                  },
                ]}
              >
                {checked ? (
                  <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                ) : null}
              </View>
              <Text style={[typography.body, { color: colors.text, marginLeft: spacing.sm }]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={sectionLabel}>Price</Text>
      <View style={[styles.pillRow, { marginBottom: spacing.xl, gap: spacing.sm }]}>
        {TICKETING_OPTIONS.map((option) => {
          const selected = value.ticketing === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() =>
                patch({ ticketing: selected ? null : option.value })
              }
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
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={sectionLabel}>Date range</Text>
      <View style={[styles.dateRow, { gap: spacing.sm, marginBottom: spacing.xs }]}>
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
      <Text
        style={[
          typography.caption,
          { color: colors.textMuted, marginBottom: spacing.xl },
        ]}
      >
        Optional. Uses MM/DD/YYYY or YYYY-MM-DD.
      </Text>

      <Text style={sectionLabel}>Setting</Text>
      <SettingSwitch
        label="Indoor"
        value={value.indoor}
        onValueChange={(indoor) => patch({ indoor })}
      />
      <SettingSwitch
        label="Outdoor"
        value={value.outdoor}
        onValueChange={(outdoor) => patch({ outdoor })}
      />
    </View>
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

function SettingSwitch({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.switchRow, { paddingVertical: spacing.sm }]}>
      <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.surface}
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
