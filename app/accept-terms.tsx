import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { AuthScreen } from '../src/components';
import { useAuth } from '../src/hooks';
import { consentComplete, EMPTY_CONSENT, LegalConsent, type LegalConsentState } from '../src/legal';
import { useTheme } from '../src/theme';

/** Signed-in users who have not accepted the current documents land here. */
export default function AcceptTermsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { acceptLegal, signOut, user } = useAuth();
  const [consent, setConsent] = useState<LegalConsentState>(EMPTY_CONSENT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = consentComplete(consent) && !submitting;
  const updated = Boolean(user?.legal?.accepted_at);

  async function onAccept() {
    setError(null);
    setSubmitting(true);
    try {
      // Accepting flips the root guard: this screen closes itself.
      await acceptLegal();
    } catch (err) {
      console.error('accept-terms', err);
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={updated ? 'We updated our terms' : 'Before you continue'}
      subtitle={
        updated
          ? 'Please review and accept the latest Terms of Use, Privacy Policy and Event Liability Disclaimer to keep using Jaunta.'
          : 'Please review and accept our Terms of Use, Privacy Policy and Event Liability Disclaimer to use Jaunta.'
      }
      hideBack
    >
      <LegalConsent value={consent} onChange={setConsent} />
      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.lg }]}>
          {error}
        </Text>
      ) : null}
      <Pressable
        testID="accept-continue"
        accessibilityRole="button"
        accessibilityLabel="Agree and continue"
        accessibilityState={{ disabled: !canSubmit }}
        disabled={!canSubmit}
        onPress={() => void onAccept()}
        style={[
          styles.submit,
          {
            backgroundColor: canSubmit || submitting ? colors.primary : colors.border,
            borderRadius: radius.md,
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
            Agree and continue
          </Text>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void signOut()}
        style={{ marginTop: spacing.xl, alignSelf: 'center', padding: spacing.sm }}
      >
        <Text style={[typography.body, { color: colors.textSecondary }]}>Sign out</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
