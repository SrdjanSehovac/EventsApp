import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import { useResponsive } from './useResponsive';

type ScreenProps = ViewProps & {
  children: ReactNode;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
};

export function Screen({
  children,
  style,
  edges = ['top', 'left', 'right'],
  ...rest
}: ScreenProps) {
  const { colors, spacing, tabBar } = useTheme();
  const { contentMaxWidth, horizontalPadding } = useResponsive();

  const bottomClearance = tabBar.height + spacing.lg;

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor: colors.background }]}
      {...rest}
    >
      <View
        style={[
          styles.inner,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomClearance,
            maxWidth: contentMaxWidth,
          },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
