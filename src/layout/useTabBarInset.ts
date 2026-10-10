import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

/** Height of the floating tab bar, including the iPhone home indicator. */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  const { tabBar, spacing } = useTheme();
  return tabBar.height + Math.max(insets.bottom, spacing.sm);
}
