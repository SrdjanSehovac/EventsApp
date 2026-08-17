import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import type { AdminPricing } from '../../types/admin';

type StackedMixBarProps = {
  pricing: AdminPricing;
  title?: string;
  embedded?: boolean;
};

type Segment = {
  key: keyof AdminPricing;
  label: string;
  count: number;
  colorKey: 'success' | 'primary' | 'textMuted';
};

export function StackedMixBar({
  pricing,
  title = 'Pricing mix',
  embedded = false,
}: StackedMixBarProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();

  const segments: Segment[] = [
    { key: 'free', label: 'Free', count: pricing.free, colorKey: 'success' },
    { key: 'paid', label: 'Paid', count: pricing.paid, colorKey: 'primary' },
    {
      key: 'unknown',
      label: 'Unknown',
      count: pricing.unknown,
      colorKey: 'textMuted',
    },
  ];

  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <View
      style={[
        !embedded && styles.card,
        !embedded && shadows.soft,
        {
          backgroundColor: embedded ? 'transparent' : colors.surface,
          borderColor: colors.border,
          borderRadius: embedded ? 0 : radius.lg,
          padding: embedded ? 0 : spacing.lg,
          flex: 1,
        },
      ]}
    >
      <Text
        style={[
          typography.heading,
          { color: colors.text, fontSize: embedded ? 15 : 17 },
        ]}
      >
        {title}
      </Text>

      {total === 0 ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginTop: spacing.md },
          ]}
        >
          No pricing data yet
        </Text>
      ) : (
        <>
          <View
            style={[
              styles.bar,
              {
                backgroundColor: colors.hairline,
                borderRadius: radius.full,
                marginTop: spacing.md,
              },
            ]}
          >
            {segments
              .filter((s) => s.count > 0)
              .map((s) => (
                <View
                  key={s.key}
                  style={{
                    flex: s.count,
                    backgroundColor: colors[s.colorKey],
                    height: '100%',
                  }}
                />
              ))}
          </View>

          <View
            style={[styles.legend, { marginTop: spacing.md, gap: spacing.sm }]}
          >
            {segments.map((s) => {
              const pct = total > 0 ? Math.round((100 * s.count) / total) : 0;
              return (
                <View key={s.key} style={styles.legendItem}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: colors[s.colorKey] },
                    ]}
                  />
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, flex: 1 },
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text, fontWeight: '600' },
                    ]}
                  >
                    {s.count} · {pct}%
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    height: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  legend: {},
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});
