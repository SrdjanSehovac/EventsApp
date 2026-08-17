import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import type { CoverageMetric } from './insights';

type MeterListProps = {
  items: CoverageMetric[];
  title?: string;
};

function meterColor(
  value: number,
  colors: { success: string; warning: string; danger: string; primary: string },
) {
  if (value >= 80) return colors.success;
  if (value >= 50) return colors.warning;
  return colors.danger;
}

export function MeterList({ items, title = 'Coverage' }: MeterListProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();

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
        {title}
      </Text>
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        {items.map((item) => {
          const fill = Math.max(0, Math.min(100, item.value));
          const trackColor = meterColor(fill, colors);
          return (
            <View key={item.key}>
              <View style={styles.labelRow}>
                <Text
                  style={[typography.caption, { color: colors.textSecondary }]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text, fontWeight: '600' },
                  ]}
                >
                  {Math.round(fill)}%
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
                      width: `${fill}%`,
                      backgroundColor: trackColor,
                      borderRadius: radius.full,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
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
