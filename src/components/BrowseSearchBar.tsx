import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

type BrowseSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onPressFilters: () => void;
  filterCount?: number;
  placeholder?: string;
};

export function BrowseSearchBar({
  value,
  onChangeText,
  onPressFilters,
  filterCount = 0,
  placeholder = 'Search events, neighbourhoods…',
}: BrowseSearchBarProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.search,
          shadows.soft,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.full,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[
            typography.body,
            styles.input,
            { color: colors.text, marginLeft: spacing.sm },
          ]}
        />
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => onChangeText('')}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open filters"
        onPress={onPressFilters}
        style={[
          styles.filter,
          shadows.soft,
          {
            backgroundColor: filterCount > 0 ? colors.primary : colors.surface,
            borderRadius: radius.full,
          },
        ]}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={filterCount > 0 ? colors.onPrimary : colors.text}
        />
        {filterCount > 0 ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.onPrimary, borderColor: colors.primary },
            ]}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 10,
                fontWeight: '800',
              }}
            >
              {filterCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  filter: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
});
