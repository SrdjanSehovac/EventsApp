import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

type LocationChipProps = {
  label: string;
  /** Clears the place and goes back to "near me". */
  onClear: () => void;
};

/** The place picked from search, with an x to go back to near me. */
export function LocationChip({ label, onClear }: LocationChipProps) {
  const { colors, typography, radius, shadows } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Showing ${label}. Clear and go back to near me`}
      onPress={onClear}
      hitSlop={6}
      style={[
        styles.chip,
        shadows.soft,
        { backgroundColor: colors.primary, borderRadius: radius.full },
      ]}
    >
      <Ionicons name="location" size={14} color={colors.onPrimary} />
      <Text
        numberOfLines={1}
        style={[typography.caption, styles.label, { color: colors.onPrimary }]}
      >
        {label}
      </Text>
      <Ionicons name="close" size={14} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
  },
  label: {
    fontWeight: '800',
    flexShrink: 1,
  },
});
