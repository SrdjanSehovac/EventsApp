import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  CityExplorer,
  deriveAdminInsights,
  HBarChart,
  KpiCard,
  MeterList,
  RecentScrapes,
  StackedMixBar,
} from '../../src/components';
import {
  useAdminCities,
  useAdminEvents,
  useAdminOverview,
} from '../../src/hooks';
import { Screen, useResponsive } from '../../src/layout';
import { useTheme } from '../../src/theme';

function formatPct(share: number | null): string | undefined {
  if (share == null) return undefined;
  return `${Math.round(share * 100)}% active`;
}

export default function AdminScreen() {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const { isPhone } = useResponsive();
  const overviewQuery = useAdminOverview();
  const citiesQuery = useAdminCities();
  const recentQuery = useAdminEvents({
    page: 1,
    page_size: 5,
    sort: '-scraped_at',
  });

  const isLoading = overviewQuery.isLoading || recentQuery.isLoading;
  const error = overviewQuery.error ?? recentQuery.error;
  const overview = overviewQuery.data;

  const insights = useMemo(
    () => (overview ? deriveAdminInsights(overview) : null),
    [overview],
  );

  const onRefresh = () => {
    void overviewQuery.refetch();
    void citiesQuery.refetch();
    void recentQuery.refetch();
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.title, { color: colors.text }]}>Admin</Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                marginTop: spacing.sm,
              },
            ]}
          >
            Pipeline health at a glance
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh admin data"
          onPress={onRefresh}
          disabled={
            overviewQuery.isFetching ||
            citiesQuery.isFetching ||
            recentQuery.isFetching
          }
          style={[
            styles.refreshBtn,
            {
              borderColor: colors.border,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
              opacity:
                overviewQuery.isFetching ||
                citiesQuery.isFetching ||
                recentQuery.isFetching
                  ? 0.6
                  : 1,
            },
          ]}
        >
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text
          style={[
            typography.body,
            { color: colors.danger, marginTop: spacing.lg },
          ]}
        >
          {error instanceof Error ? error.message : 'Failed to load admin data'}
        </Text>
      ) : overview && insights ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.lg,
          }}
        >
          <View
            style={[
              styles.insight,
              shadows.soft,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primary,
                borderRadius: radius.lg,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={styles.insightIcon}>
              <Ionicons
                name={
                  insights.isQuietPipeline || insights.weakestCoverage.value < 70
                    ? 'alert-circle-outline'
                    : 'sparkles-outline'
                }
                size={18}
                color={colors.primary}
              />
            </View>
            <Text
              style={[
                typography.body,
                {
                  color: colors.text,
                  flex: 1,
                  fontSize: 15,
                  lineHeight: 21,
                },
              ]}
            >
              {insights.insight}
            </Text>
          </View>

          <View
            style={[
              styles.kpiGrid,
              {
                gap: spacing.sm,
                flexDirection: 'row',
                flexWrap: 'wrap',
              },
            ]}
          >
            <KpiCard
              label="Events"
              value={overview.totals.events}
              context={formatPct(insights.liveShare)}
            />
            <KpiCard
              label="Scraped 24h"
              value={overview.freshness.scraped_last_24h}
              context={`${overview.freshness.scraped_last_7d} this week`}
            />
            <KpiCard
              label="Upcoming"
              value={overview.freshness.upcoming}
              context={
                overview.freshness.past > 0
                  ? `${overview.freshness.past} past`
                  : undefined
              }
            />
            <KpiCard
              label="Catalog health"
              value={`${insights.catalogHealth}%`}
              context={
                insights.weakestCoverage.value < 100
                  ? `Weakest: ${insights.weakestCoverage.label}`
                  : 'All coverage complete'
              }
            />
          </View>

          <MeterList items={insights.coverageMeters} />

          <View
            style={{
              flexDirection: isPhone ? 'column' : 'row',
              gap: spacing.lg,
            }}
          >
            <StackedMixBar pricing={overview.pricing} />
            <HBarChart
              title="Top sources"
              items={overview.distributions.by_source}
              maxItems={5}
            />
          </View>

          <HBarChart
            title="Top categories"
            items={overview.distributions.by_category}
            maxItems={6}
          />

          <CityExplorer
            data={citiesQuery.data}
            isLoading={citiesQuery.isLoading}
            error={
              citiesQuery.error instanceof Error ? citiesQuery.error : null
            }
          />

          <RecentScrapes items={recentQuery.data?.items ?? []} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  insightIcon: {
    marginTop: 2,
  },
  kpiGrid: {},
});
