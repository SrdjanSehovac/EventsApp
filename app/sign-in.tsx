import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { ApiError } from '../src/api/client';
import { AuthField, AuthScreen } from '../src/components';
import { useAuth } from '../src/hooks';
import { useTheme } from '../src/theme';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'Sign-in is not available yet (EventServer needs POST /v1/auth/login).';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Could not sign in.';
}

export default function SignInScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Sign in"
      subtitle="Use the email and password on your EventServer account."
    >
      <AuthField
        label="EMAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <AuthField
        label="PASSWORD"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
      />

      {error ? (
        <Text
          style={[
            typography.caption,
            { color: colors.danger, marginBottom: spacing.lg },
          ]}
        >
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        onPress={() => void onSubmit()}
        disabled={submitting}
        style={[
          styles.submit,
          {
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            opacity: submitting ? 0.7 : 1,
          },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Sign in
          </Text>
        )}
      </Pressable>

      <View style={[styles.switchRow, { marginTop: spacing.xl }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          New here?{' '}
        </Text>
        <Link href="/sign-up" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Create an account">
            <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>
              Create an account
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
