import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

export type SelectOption = {
  label: string;
  value: string | null;
};

type SelectFieldProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  compact?: boolean;
};

export function SelectField({
  icon,
  label,
  placeholder = 'Any',
  value,
  options,
  onChange,
  compact = false,
}: SelectFieldProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);
  // Always show the option's own label — never prefix the field `label`
  // (e.g. "City: Toronto"). Section headers live outside this control.
  const display = selected?.label ?? placeholder;

  return (
    <View>
      {label ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginBottom: spacing.xs },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: compact ? spacing.sm : spacing.md,
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={colors.primary}
            style={{ marginRight: spacing.sm }}
          />
        ) : null}
        <Text
          numberOfLines={1}
          style={[typography.caption, styles.triggerLabel, { color: colors.text }]}
        >
          {display}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
            onPress={() => {}}
          >
            {label ? (
              <Text
                style={[
                  typography.heading,
                  {
                    color: colors.text,
                    fontSize: 16,
                    paddingHorizontal: spacing.lg,
                    paddingTop: spacing.lg,
                    paddingBottom: spacing.sm,
                  },
                ]}
              >
                {label}
              </Text>
            ) : null}
            <ScrollView style={styles.optionList} bounces={false}>
              {options.map((option) => {
                const selectedOption = option.value === value;
                return (
                  <Pressable
                    key={option.value ?? '__any__'}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: selectedOption }}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      {
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        backgroundColor: selectedOption
                          ? colors.primaryMuted
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.body,
                        {
                          color: selectedOption ? colors.primary : colors.text,
                          fontWeight: selectedOption ? '600' : '400',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedOption ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  triggerLabel: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    maxHeight: '70%',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  optionList: {
    maxHeight: 360,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
