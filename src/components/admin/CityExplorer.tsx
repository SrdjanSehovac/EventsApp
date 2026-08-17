import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useResponsive } from '../../layout';
import { useTheme } from '../../theme';
import type { AdminCitiesResponse, AdminCityBreakdown } from '../../types/admin';
import { HBarChart } from './HBarChart';
import { StackedMixBar } from './StackedMixBar';

type CityExplorerProps = {
  data?: AdminCitiesResponse;
  isLoading?: boolean;
  error?: Error | null;
};

function CityChip({
  city,
  selected,
  share,
  onPress,
}: {
  city: AdminCityBreakdown;
  selected: boolean;
  share: number;
  onPress: () => void;
}) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: radius.full,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : colors.background,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <Text
        style={[
          typography.caption,
          {
            color: selected ? colors.onPrimary : colors.text,
            fontWeight: '600',
          },
        ]}
      >
        {city.label}
      </Text>
      <Text
        style={[
          typography.caption,
          {
            color: selected ? colors.onPrimary : colors.textMuted,
            marginLeft: spacing.xs,
            opacity: selected ? 0.9 : 1,
          },
        ]}
      >
        {city.events}
        {share > 0 ? ` · ${share}%` : ''}
      </Text>
    </Pressable>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: colors.background,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          flex: 1,
        },
      ]}
    >
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.heading,
          { color: colors.text, fontSize: 18, marginTop: 2 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function CityExplorer({ data, isLoading, error }: CityExplorerProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const { isPhone } = useResponsive();
  const cities = data?.cities ?? [];
  const totalEvents = data?.total_events ?? 0;

  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    if (cities.length === 0) {
      setSelectedCity(null);
      return;
    }
    if (!selectedCity || !cities.some((c) => c.city === selectedCity)) {
      setSelectedCity(cities[0].city);
    }
  }, [cities, selectedCity]);

  const selected = useMemo(
    () => cities.find((c) => c.city === selectedCity) ?? null,
    [cities, selectedCity],
  );

  const cityBars = useMemo(
    () =>
      cities.map((c) => ({
        key: c.city,
        label: c.label,
        count: c.events,
      })),
    [cities],
  );

  return (
    <View
      style={[
        styles.card,
        shadows.soft,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <Text style={[typography.heading, { color: colors.text, fontSize: 17 }]}>
        Cities
      </Text>
      <Text
        style={[
          typography.caption,
          { color: colors.textSecondary, marginTop: spacing.xs },
        ]}
      >
        Tap a city to inspect pricing, sources, and categories
      </Text>

      {isLoading ? (
        <View style={[styles.centered, { marginTop: spacing.xl }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text
          style={[
            typography.caption,
            { color: colors.danger, marginTop: spacing.md },
          ]}
        >
          {error.message || 'Failed to load city data'}
        </Text>
      ) : cities.length === 0 ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginTop: spacing.md },
          ]}
        >
          No cities yet
        </Text>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: spacing.sm,
              paddingVertical: spacing.md,
            }}
          >
            {cities.map((city) => {
              const share =
                totalEvents > 0
                  ? Math.round((100 * city.events) / totalEvents)
                  : 0;
              return (
                <CityChip
                  key={city.city}
                  city={city}
                  selected={city.city === selectedCity}
                  share={share}
                  onPress={() => setSelectedCity(city.city)}
                />
              );
            })}
          </ScrollView>

          <HBarChart
            title="Events by city"
            items={cityBars}
            maxItems={8}
            embedded
            selectedKey={selectedCity}
            onSelect={(bucket) => setSelectedCity(bucket.key)}
          />

          {selected ? (
            <View
              style={[
                styles.detail,
                {
                  marginTop: spacing.lg,
                  paddingTop: spacing.lg,
                  borderTopColor: colors.border,
                  gap: spacing.lg,
                },
              ]}
            >
              <View>
                <Text
                  style={[
                    typography.heading,
                    { color: colors.text, fontSize: 16 },
                  ]}
                >
                  {selected.label}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textMuted, marginTop: 2 },
                  ]}
                >
                  {totalEvents > 0
                    ? `${Math.round((100 * selected.events) / totalEvents)}% of catalog`
                    : 'City breakdown'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <StatPill label="Events" value={selected.events} />
                <StatPill label="Active" value={selected.active} />
                <StatPill label="Upcoming" value={selected.upcoming} />
              </View>

              <View
                style={{
                  flexDirection: isPhone ? 'column' : 'row',
                  gap: spacing.lg,
                }}
              >
                <StackedMixBar
                  pricing={selected.pricing}
                  title="Pricing"
                  embedded
                />
                <HBarChart
                  title="Sources"
                  items={selected.by_source}
                  maxItems={5}
                  embedded
                />
              </View>

              <View
                style={{
                  flexDirection: isPhone ? 'column' : 'row',
                  gap: spacing.lg,
                }}
              >
                <HBarChart
                  title="Categories"
                  items={selected.by_category}
                  maxItems={6}
                  embedded
                />
                <HBarChart
                  title="Neighbourhoods"
                  items={selected.by_neighbourhood}
                  maxItems={6}
                  emptyLabel="No neighbourhood data"
                  embedded
                />
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statPill: {},
});
