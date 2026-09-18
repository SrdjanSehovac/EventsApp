import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import { BrowseSearchBar } from './BrowseSearchBar';

type BrowseHeaderProps = {
  value: string;
  onChangeText: (value: string) => void;
  onPressFilters: () => void;
  filterCount?: number;
  title?: string;
  placeholder?: string;
};

export function BrowseHeader({
  value,
  onChangeText,
  onPressFilters,
  filterCount = 0,
  title = 'Nearby events',
  placeholder = 'Search events, neighbourhoods…',
}: BrowseHeaderProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
      <View style={[styles.wrap, { paddingHorizontal: spacing.lg }]}>
        <Text style={[typography.heading, { color: colors.text, fontSize: 22 }]}>
          {title}
        </Text>
        <BrowseSearchBar
          value={value}
          onChangeText={onChangeText}
          onPressFilters={onPressFilters}
          filterCount={filterCount}
          placeholder={placeholder}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
  },
});
