import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

type BrowseHeaderProps = {
  value: string;
  onChangeText: (value: string) => void;
  onPressFilters: () => void;
  filterCount?: number;
  placeholder?: string;
};

export function BrowseHeader({
  value,
  onChangeText,
  onPressFilters,
  filterCount = 0,
  placeholder = 'Search events, neighbourhoods…',
}: BrowseHeaderProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.header }}>
        <View style={styles.brandBar}>
          <Text
            style={[
              typography.heading,
              { color: colors.onHeader, fontSize: 18, letterSpacing: 0.2 },
            ]}
          >
            Find events
          </Text>
        </View>
      </SafeAreaView>
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.search,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
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
          style={styles.filterHit}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={filterCount > 0 ? colors.primary : colors.text}
          />
          {filterCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.onPrimary, fontSize: 10, fontWeight: '800' }}>
                {filterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandBar: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
  filterHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
});
