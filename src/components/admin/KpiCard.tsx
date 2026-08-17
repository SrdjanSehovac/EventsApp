import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';

type KpiCardProps = {
  label: string;
  value: string | number;
  context?: string;
};

export function KpiCard({ label, value, context }: KpiCardProps) {
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
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.title,
          {
            color: colors.text,
            fontSize: 26,
            lineHeight: 32,
            marginTop: spacing.xs,
          },
        ]}
      >
        {value}
      </Text>
      {context ? (
        <Text
          numberOfLines={1}
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          {context}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
