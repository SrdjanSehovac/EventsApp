import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import type { DistBucket } from '../../types/common';

type HBarChartProps = {
  items: DistBucket[];
  title: string;
  maxItems?: number;
  emptyLabel?: string;
  /** Drop card chrome when nested inside another panel */
  embedded?: boolean;
  selectedKey?: string | null;
  onSelect?: (bucket: DistBucket) => void;
};

export function HBarChart({
  items,
  title,
  maxItems = 6,
  emptyLabel = 'No data yet',
  embedded = false,
  selectedKey,
  onSelect,
}: HBarChartProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();

  const top = items.slice(0, maxItems);
  const maxCount = top.reduce((m, b) => Math.max(m, b.count), 0) || 1;

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

      {top.length === 0 ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginTop: spacing.md },
          ]}
        >
          {emptyLabel}
        </Text>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {top.map((bucket) => {
            const pct = Math.round((100 * bucket.count) / maxCount);
            const selected = selectedKey === bucket.key;
            const row = (
              <View>
                <View style={styles.labelRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.caption,
                      {
                        color: selected ? colors.primary : colors.textSecondary,
                        flex: 1,
                        marginRight: 8,
                        fontWeight: selected ? '700' : '500',
                      },
                    ]}
                  >
                    {bucket.label}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: selected ? colors.primary : colors.text,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {bucket.count}
                  </Text>
                </View>
                <View
                  style={[
                    styles.track,
                    {
                      backgroundColor: colors.hairline,
                      borderRadius: radius.full,
                      marginTop: spacing.xs,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${pct}%`,
                        backgroundColor: selected
                          ? colors.accent
                          : colors.primary,
                        borderRadius: radius.full,
                      },
                    ]}
                  />
                </View>
              </View>
            );

            if (!onSelect) return <View key={bucket.key}>{row}</View>;

            return (
              <Pressable
                key={bucket.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(bucket)}
              >
                {row}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: {
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
