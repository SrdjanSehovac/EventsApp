import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthScreen } from '../src/components';
import { useAuth } from '../src/hooks';
import { useTheme } from '../src/theme';

export default function AccountScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { user, isSignedIn, status, signOut } = useAuth();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <AuthScreen title="Account">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <AuthScreen title="Account" subtitle="Sign in to save favourites across devices.">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          onPress={() => router.push('/sign-in')}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Sign in
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create account"
          onPress={() => router.push('/sign-up')}
          style={[
            styles.button,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
            Create account
          </Text>
        </Pressable>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Account">
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            marginBottom: spacing.xl,
          },
        ]}
      >
        <Text style={[typography.heading, { color: colors.text }]}>
          {user.display_name}
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          {user.email}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View favourites"
        onPress={() => router.push('/favourites')}
        style={[
          styles.button,
          { backgroundColor: colors.primary, borderRadius: radius.md },
        ]}
      >
        <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
          Favourites
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => void signOut()}
        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radius.md,
            marginTop: spacing.md,
          },
        ]}
      >
        <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
          Sign out
        </Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
