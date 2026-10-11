import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

type CheckoutSheetFrameProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function CheckoutSheetFrame({
  visible,
  title,
  onClose,
  children,
}: CheckoutSheetFrameProps) {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, spacing.md),
              borderBottomColor: colors.hairline,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              typography.heading,
              styles.title,
              { color: colors.text, fontSize: 17 },
            ]}
          >
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            onPress={onClose}
            hitSlop={8}
            style={styles.done}
          >
            <Text
              style={[
                typography.body,
                { color: colors.primary, fontWeight: '800' },
              ]}
            >
              Done
            </Text>
          </Pressable>
        </View>
        <View style={styles.body}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
  },
  done: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
});
