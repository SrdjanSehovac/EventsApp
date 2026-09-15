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
      return 'Sign-up is not available yet (EventServer needs POST /v1/auth/signup).';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Could not create account.';
}

export default function SignUpScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Display name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        display_name: displayName.trim(),
      });
      router.replace('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Create account"
      subtitle="Email and password only — no Ticketmaster or Gemini required."
    >
      <AuthField
        label="DISPLAY NAME"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Alex"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
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
        placeholder="At least 8 characters"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
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
        accessibilityLabel="Create account"
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
            Create account
          </Text>
        )}
      </Pressable>

      <View style={[styles.switchRow, { marginTop: spacing.xl }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Already have an account?{' '}
        </Text>
        <Link href="/sign-in" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Sign in">
            <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>
              Sign in
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
