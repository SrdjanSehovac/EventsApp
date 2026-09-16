import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../theme';

type ListPaneChevronProps = {
  /** True when the list pane is showing (map is a strip). */
  listOpen: boolean;
};

export function ListPaneChevron({ listOpen }: ListPaneChevronProps) {
  const { colors, shadows } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listOpen ? 'Expand map' : 'Show event list'}
      onPress={() => router.navigate(listOpen ? '/' : '/events')}
      style={[
        styles.chevron,
        shadows.soft,
        { backgroundColor: colors.surface },
      ]}
    >
      <Ionicons
        name={listOpen ? 'chevron-forward' : 'chevron-back'}
        size={20}
        color={colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chevron: {
    position: 'absolute',
    left: 0,
    top: '46%',
    width: 28,
    height: 56,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
});
