import type { AdminCoverage, AdminOverview } from '../../types/admin';

export type CoverageKey = keyof AdminCoverage;

export type CoverageMetric = {
  key: CoverageKey;
  label: string;
  value: number;
};

/** Coverage rows shown on the dashboard (omit enriched_at — tracks embedding). */
export const COVERAGE_DISPLAY: { key: CoverageKey; label: string }[] = [
  { key: 'with_summary', label: 'Summary' },
  { key: 'with_venue', label: 'Venue' },
  { key: 'with_category', label: 'Category' },
  { key: 'with_embedding', label: 'Embedding' },
];

const ALL_COVERAGE_KEYS: CoverageKey[] = [
  'with_summary',
  'with_embedding',
  'with_enriched_at',
  'with_venue',
  'with_category',
];

const COVERAGE_LABELS: Record<CoverageKey, string> = {
  with_summary: 'summary',
  with_embedding: 'embedding',
  with_enriched_at: 'enrichment',
  with_venue: 'venue',
  with_category: 'category',
};

export type AdminInsights = {
  catalogHealth: number;
  weakestCoverage: CoverageMetric;
  scrapePaceRatio: number;
  isQuietPipeline: boolean;
  freeShare: number | null;
  liveShare: number | null;
  insight: string;
  coverageMeters: CoverageMetric[];
};

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function deriveAdminInsights(overview: AdminOverview): AdminInsights {
  const { totals, coverage, pricing, freshness } = overview;

  const coverageValues = ALL_COVERAGE_KEYS.map((key) => coverage[key]);
  const catalogHealth = Math.round(avg(coverageValues));

  let weakestKey: CoverageKey = ALL_COVERAGE_KEYS[0];
  for (const key of ALL_COVERAGE_KEYS) {
    if (coverage[key] < coverage[weakestKey]) weakestKey = key;
  }
  const weakestCoverage: CoverageMetric = {
    key: weakestKey,
    label: COVERAGE_LABELS[weakestKey],
    value: coverage[weakestKey],
  };

  const dailyAvg7d = freshness.scraped_last_7d / 7;
  const scrapePaceRatio =
    dailyAvg7d > 0 ? freshness.scraped_last_24h / dailyAvg7d : freshness.scraped_last_24h > 0 ? 1 : 0;
  const isQuietPipeline =
    freshness.scraped_last_7d >= 7 && scrapePaceRatio < 0.5;

  const priced = pricing.free + pricing.paid;
  const freeShare = priced > 0 ? pricing.free / priced : null;

  const liveShare =
    totals.events > 0 ? totals.active / totals.events : null;

  const coverageMeters: CoverageMetric[] = COVERAGE_DISPLAY.map(({ key, label }) => ({
    key,
    label,
    value: coverage[key],
  }));

  let insight: string;
  if (isQuietPipeline) {
    insight = `Pipeline quiet — ${freshness.scraped_last_24h} scraped today vs ~${Math.round(dailyAvg7d)}/day this week`;
  } else if (weakestCoverage.value < 70) {
    insight = `${Math.round(weakestCoverage.value)}% ${weakestCoverage.label} coverage is the weakest link`;
  } else {
    const todayBit =
      freshness.scraped_last_24h > 0
        ? ` · ${freshness.scraped_last_24h} new today`
        : '';
    insight = `${catalogHealth}% catalog health${todayBit}`;
  }

  return {
    catalogHealth,
    weakestCoverage,
    scrapePaceRatio,
    isQuietPipeline,
    freeShare,
    liveShare,
    insight,
    coverageMeters,
  };
}
