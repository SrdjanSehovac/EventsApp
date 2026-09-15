import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ApiError } from '../src/api/client';
import { AuthScreen } from '../src/components';
import { useAuth, useVerifyBusinessEmail } from '../src/hooks';
import { useTheme } from '../src/theme';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Could not verify that email.';
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function BusinessVerifyScreen() {
  const { colors, typography, radius, spacing } = useTheme();
  const { isSignedIn, status } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[]; code?: string | string[] }>();
  const verify = useVerifyBusinessEmail();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const token = firstParam(params.token).trim();
  const code = firstParam(params.code).trim();

  useEffect(() => {
    if (status === 'loading' || !isSignedIn || done || verify.isPending) return;
    if (!token && !code) {
      setError('This verification link is missing a token.');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await verify.mutateAsync(token ? { token } : { code });
        if (!cancelled) setDone(true);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally run once the session is ready; token/code are from the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isSignedIn]);

  if (status === 'loading') {
    return (
      <AuthScreen title="Verify email">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }

  if (!isSignedIn) {
    return (
      <AuthScreen
        title="Verify email"
        subtitle="Sign in with the same account, then we’ll confirm the business mailbox."
      >
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
      </AuthScreen>
    );
  }

  if (done) {
    return (
      <AuthScreen
        title="Email confirmed"
        subtitle="Thanks — next is a digital review of your website and mailbox. No ID selfie required."
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View business status"
          onPress={() => router.replace('/business')}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            View status
          </Text>
        </Pressable>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Verify email"
      subtitle={error ?? 'Confirming the token from your business email…'}
    >
      {error ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open business status"
          onPress={() => router.replace('/business')}
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Open status
          </Text>
        </Pressable>
      ) : (
        <ActivityIndicator color={colors.primary} />
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
