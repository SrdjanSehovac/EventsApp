import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

export type SelectOption = {
  label: string;
  value: string | null;
  /** Section title. Consecutive options with the same group render under one header. */
  group?: string;
};

type SelectFieldProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  compact?: boolean;
  /** Filter the list by label. Use for long option sets such as cities. */
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function SelectField({
  icon,
  label,
  placeholder = 'Any',
  value,
  options,
  onChange,
  compact = false,
  searchable = false,
  searchPlaceholder = 'Search…',
}: SelectFieldProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value);
  // Show the option label only — never prefix the field `label` (e.g. "City:").
  const display = selected?.label ?? value ?? placeholder;
  const needle = query.trim().toLowerCase();
  const visibleOptions = needle
    ? options.filter((option) => {
        const haystack = `${option.label} ${option.group ?? ''}`.toLowerCase();
        return haystack.includes(needle);
      })
    : options;

  function close() {
    setOpen(false);
    setQuery('');
  }

  return (
    <View>
      {label ? (
        <Text
          style={[
            typography.caption,
            {
              color: colors.textMuted,
              marginBottom: spacing.xs,
              fontWeight: '700',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
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

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={[styles.overlay, { backgroundColor: colors.overlay }]}
            onPress={close}
          >
            <View
              onStartShouldSetResponder={() => true}
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                },
              ]}
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
              {searchable ? (
                <View
                  style={[
                    styles.search,
                    {
                      marginHorizontal: spacing.lg,
                      marginBottom: spacing.sm,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Ionicons name="search" size={16} color={colors.primary} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    style={[
                      typography.body,
                      styles.searchInput,
                      { color: colors.text, marginLeft: spacing.sm },
                    ]}
                  />
                </View>
              ) : null}
              <ScrollView
                style={searchable ? styles.optionListTall : styles.optionList}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {visibleOptions.length === 0 ? (
                  <Text
                    style={[
                      typography.body,
                      {
                        color: colors.textMuted,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.lg,
                      },
                    ]}
                  >
                    No matches
                  </Text>
                ) : null}
                {visibleOptions.map((option, index) => {
                  const selectedOption = option.value === value;
                  const showGroup =
                    Boolean(option.group) &&
                    option.group !== visibleOptions[index - 1]?.group;
                  return (
                    <View key={`${option.group ?? ''}:${option.value ?? '__any__'}`}>
                      {showGroup ? (
                        <Text
                          accessibilityRole="header"
                          style={[
                            typography.caption,
                            {
                              color: colors.textMuted,
                              fontWeight: '700',
                              letterSpacing: 0.6,
                              textTransform: 'uppercase',
                              paddingHorizontal: spacing.lg,
                              paddingTop: spacing.md,
                              paddingBottom: spacing.xs,
                            },
                          ]}
                        >
                          {option.group}
                        </Text>
                      ) : null}
                      <Pressable
                        onPress={() => {
                          onChange(option.value);
                          close();
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
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    maxHeight: '80%',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  optionList: {
    maxHeight: 360,
  },
  optionListTall: {
    maxHeight: 420,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
});
