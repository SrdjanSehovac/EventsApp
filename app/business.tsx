import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AuthField, AuthScreen, DigitalProofNote } from '../src/components';
import { useAuth, useMyBusiness, useResendBusinessVerification, useVerifyBusinessEmail } from '../src/hooks';
import { useTheme } from '../src/theme';
import { BUSINESS_KIND_LABELS } from '../src/types/business';
import { friendlyPublicError } from '../src/utils/publicError';
import type { BusinessProfile } from '../src/types/business';

function errorMessage(error: unknown) {
  return friendlyPublicError(error, "Couldn't update your application. Please try again.");
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'pending' | 'success' | 'danger' | 'review';
}) {
  const { colors, typography, radius } = useTheme();
  const background = colors.surfaceElevated;
  const color =
    tone === 'success'
      ? colors.success
      : tone === 'danger'
        ? colors.danger
        : tone === 'review'
          ? colors.warning
          : colors.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: background, borderRadius: radius.full }]}>
      <Text style={[typography.caption, { color, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

function headingFor(profile: BusinessProfile) {
  switch (profile.status) {
    case 'pending_email':
      return {
        title: 'Verify your email',
        subtitle:
          profile.delivery === 'unavailable' || profile.delivery === 'failed'
            ? `We couldn’t email a code to ${profile.business_email} right now. Your application is still in the review queue and we’ll confirm your email directly.`
            : `Enter the 6-digit code we sent to ${profile.business_email}.`,
        badge: { label: 'Pending email', tone: 'pending' as const },
      };
    case 'pending_review':
      return {
        title: 'In review',
        subtitle: `Thanks — a person reviews every organizer application. We’ll check ${profile.business_name}’s website, links and email.`,
        badge: { label: 'Pending review', tone: 'review' as const },
      };
    case 'verified':
      return {
        title: profile.suspended ? 'Posting paused' : 'You’re a verified organizer',
        subtitle: profile.suspended
          ? 'Posting is paused for this account. Contact support if you think this is a mistake.'
          : `Post events as ${profile.business_name}. Your first 3 events are reviewed before they go live.`,
        badge: { label: 'Verified', tone: 'success' as const },
      };
    case 'rejected':
      return {
        title: 'Not approved',
        subtitle:
          profile.rejection_reason ||
          'This application wasn’t approved. You can apply again with more details.',
        badge: { label: 'Rejected', tone: 'danger' as const },
      };
    default:
      return {
        title: 'Organizer application',
        subtitle: 'Digital proof only — no ID selfie required.',
        badge: { label: 'Pending', tone: 'pending' as const },
      };
  }
}

export default function BusinessStatusScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { isSignedIn, status } = useAuth();
  const router = useRouter();
  const businessQuery = useMyBusiness(isSignedIn);
  const verify = useVerifyBusinessEmail();
  const resend = useResendBusinessVerification();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const profile = businessQuery.data;

  async function onVerify() {
    setError(null);
    const value = code.trim();
    if (!value) {
      setError('Enter the code from your work email.');
      return;
    }
    try {
      await verify.mutateAsync({ code: value });
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function onResend() {
    setError(null);
    setResent(false);
    try {
      await resend.mutateAsync();
      setResent(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (status === 'loading' || (isSignedIn && businessQuery.isLoading)) {
    return (
      <AuthScreen title="Organizer">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }

  if (!isSignedIn) {
    return (
      <AuthScreen title="Organizer" subtitle="Sign in to see your application.">
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

  if (businessQuery.error && !profile) {
    return (
      <AuthScreen title="Organizer" subtitle={errorMessage(businessQuery.error)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={() => void businessQuery.refetch()}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Try again
          </Text>
        </Pressable>
      </AuthScreen>
    );
  }

  if (!profile) {
    return (
      <AuthScreen
        title="Organizer"
        subtitle="You’re not a verified organizer yet. Venues, businesses and community groups can apply."
      >
        <DigitalProofNote />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Become an organizer"
          onPress={() => router.push('/become-business')}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Become an organizer
          </Text>
        </Pressable>
      </AuthScreen>
    );
  }

  const copy = headingFor(profile);

  return (
    <AuthScreen title="Organizer" subtitle={copy.subtitle}>
      <View style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
        <StatusBadge label={copy.badge.label} tone={copy.badge.tone} />
      </View>

      <Text style={[typography.heading, { color: colors.text, marginBottom: spacing.sm }]}>
        {copy.title}
      </Text>

      <View
        style={[
          styles.details,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
          {profile.business_name}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          {BUSINESS_KIND_LABELS[profile.kind]} · {profile.city}
        </Text>
        {profile.website || profile.social_url ? (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
            {profile.website || profile.social_url}
          </Text>
        ) : null}
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          {profile.business_email}
        </Text>
        {profile.source === 'local' ? (
          <Text style={[typography.caption, { color: colors.warning, marginTop: 8 }]}>
            Saved on this device. It will sync when the service can accept it.
          </Text>
        ) : null}
      </View>

      {profile.status === 'pending_email' ? (
        <>
          <DigitalProofNote />
          <AuthField
            label="CODE FROM EMAIL"
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          {error ? (
            <Text style={[typography.body, { color: colors.danger, marginBottom: spacing.md }]}>
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm business email"
            onPress={() => void onVerify()}
            disabled={verify.isPending}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                opacity: verify.isPending ? 0.7 : 1,
              },
            ]}
          >
            {verify.isPending ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
                Confirm email
              </Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resend verification email"
            onPress={() => void onResend()}
            disabled={resend.isPending}
            style={[styles.linkBtn, { marginTop: spacing.md }]}
          >
            <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>
              {resent ? 'New code sent' : 'Send a new code'}
            </Text>
          </Pressable>
        </>
      ) : null}

      {profile.status === 'pending_review' ? (
        <View
          style={[
            styles.info,
            {
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
            ]}
          >
            We check your website or social link, work email and business details.
            We will not ask for a face scan or government ID.
          </Text>
        </View>
      ) : null}

      {profile.status === 'verified' && !profile.suspended ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post an event"
          onPress={() => router.push('/submit-event')}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Post an event
          </Text>
        </Pressable>
      ) : null}

      {profile.status === 'rejected' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apply again"
          onPress={() => router.push('/become-business')}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Apply again
          </Text>
        </Pressable>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  details: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  linkBtn: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
