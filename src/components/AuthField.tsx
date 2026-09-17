import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../theme';

type AuthFieldProps = TextInputProps & {
  label: string;
};

export function AuthField({ label, style, ...rest }: AuthFieldProps) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={[
          typography.caption,
          {
            color: colors.textMuted,
            fontWeight: '700',
            letterSpacing: 0.6,
            marginBottom: spacing.sm,
          },
        ]}
      >
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        style={[
          typography.body,
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    paddingVertical: 12,
  },
});
