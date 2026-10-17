import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

/** Small "Verified" chip for events posted by a verified organizer. */
export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  const { colors, typography, radius } = useTheme();
  return (
    <View
      accessibilityLabel="Verified organizer"
      style={[styles.badge, { backgroundColor: colors.primaryMuted, borderRadius: radius.full }]}
    >
      <Ionicons name="checkmark-circle" size={compact ? 12 : 14} color={colors.primary} />
      <Text style={[typography.caption, { color: colors.primary, fontWeight: '800', fontSize: compact ? 11 : 12 }]}>
        Verified
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
});
