import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useResponsive } from '../layout';
import { useTheme } from '../theme';

type AuthScreenProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
};

export function AuthScreen({
  title,
  subtitle,
  children,
  scroll = true,
}: AuthScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const router = useRouter();
  const formMaxWidth = Math.min(contentMaxWidth ?? 440, 440);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.header,
            { paddingHorizontal: horizontalPadding, borderBottomColor: colors.border },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
            hitSlop={8}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[typography.heading, { color: colors.text, flex: 1 }]}>
            {title}
          </Text>
        </View>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingTop: spacing.xl,
              paddingBottom: spacing.xxxl,
              maxWidth: formMaxWidth,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            {subtitle ? (
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginBottom: spacing.xl },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
            {children}
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              paddingHorizontal: horizontalPadding,
              paddingTop: spacing.xl,
              maxWidth: formMaxWidth,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            {subtitle ? (
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginBottom: spacing.xl },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
