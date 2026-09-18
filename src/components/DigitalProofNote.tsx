import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

type DigitalProofNoteProps = {
  compact?: boolean;
};

export function DigitalProofNote({ compact = false }: DigitalProofNoteProps) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.note,
        {
          backgroundColor: colors.primaryMuted,
          borderRadius: radius.md,
          padding: compact ? spacing.sm : spacing.md,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
      <Text
        style={[
          typography.caption,
          { color: colors.text, flex: 1, marginLeft: spacing.sm, fontWeight: '600' },
        ]}
      >
        Verify your business email — same domain as your website works best. No ID
        selfie required.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
