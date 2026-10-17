import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';

import { friendlyAuthError } from '../src/auth/authErrors';
import { AuthField, AuthScreen } from '../src/components';
import { useAuth } from '../src/hooks';
import {
  consentComplete,
  EMPTY_CONSENT,
  LegalConsent,
  legalAcceptance,
  type LegalConsentState,
} from '../src/legal';
import { useTheme } from '../src/theme';

const REASON_COPY: Record<string, string> = {
  save: 'Create a free account to save events. Takes 30 seconds.',
  calendar: 'Create a free account to add events to your calendar. Takes 30 seconds.',
  share: 'Create a free account to share events. Takes 30 seconds.',
  post: 'Create a free account to post or suggest events. Takes 30 seconds.',
  rsvp: 'Create a free account to RSVP. Takes 30 seconds.',
  default: 'Takes 30 seconds. Your account keeps your saved events, reminders and RSVPs.',
};

export default function SignUpScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState<LegalConsentState>(EMPTY_CONSENT);
  const canSubmit = consentComplete(consent) && !submitting;

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
    if (!consentComplete(consent)) {
      setError('Please tick all three boxes to create your account.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        display_name: displayName.trim(),
        legal: legalAcceptance(),
      });
      // The sheet closes itself (only mounted while signed out); the action
      // that opened it then runs from the root navigator.
    } catch (err) {
      setError(friendlyAuthError(err, 'sign-up'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Create your Jaunta account"
      subtitle={REASON_COPY[reason ?? ''] ?? REASON_COPY.default}
      hideBack={!router.canGoBack()}
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

      <LegalConsent value={consent} onChange={setConsent} />

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
        accessibilityState={{ disabled: !canSubmit }}
        testID="create-account"
        onPress={() => void onSubmit()}
        disabled={!canSubmit}
        style={[
          styles.submit,
          {
            backgroundColor: canSubmit || submitting ? colors.primary : colors.border,
            borderRadius: radius.md,
            opacity: submitting ? 0.7 : 1,
          },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text
            style={[
              typography.body,
              { color: canSubmit ? colors.onPrimary : colors.textMuted, fontWeight: '700' },
            ]}
          >
            Create account
          </Text>
        )}
      </Pressable>

      <View style={[styles.switchRow, { marginTop: spacing.xl }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Already have an account?{' '}
        </Text>
        <Link href="/sign-in" replace asChild>
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
