import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ApiError } from '../src/api/client';
import { AuthField, AuthScreen, DigitalProofNote } from '../src/components';
import { SW_ONTARIO_CITIES } from '../src/config/cities';
import { domainsAlign, looksLikeEmail, looksLikeWebsite, normalizeWebsite } from '../src/business/proof';
import { useApplyAsBusiness, useAuth, useMyBusiness } from '../src/hooks';
import { useTheme } from '../src/theme';
import {
  BUSINESS_KIND_LABELS,
  BUSINESS_KINDS,
  type BusinessKind,
  type BusinessProfile,
} from '../src/types/business';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Could not submit the application.';
}

type ApplyFormProps = {
  initial?: BusinessProfile | null;
};

function ApplyForm({ initial }: ApplyFormProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const apply = useApplyAsBusiness();
  const [businessName, setBusinessName] = useState(initial?.business_name ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  const [businessEmail, setBusinessEmail] = useState(initial?.business_email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [city, setCity] = useState<string>(initial?.city ?? SW_ONTARIO_CITIES[0]);
  const [kind, setKind] = useState<BusinessKind>(initial?.kind ?? 'venue');
  const [error, setError] = useState<string | null>(null);

  const domainHint = useMemo(() => {
    if (!website.trim() || !businessEmail.trim()) return null;
    if (!looksLikeWebsite(website) || !looksLikeEmail(businessEmail)) return null;
    if (domainsAlign(website, businessEmail)) return 'match';
    return 'mismatch';
  }, [website, businessEmail]);

  async function onSubmit() {
    setError(null);
    if (businessName.trim().length < 2) {
      setError('Business name is required.');
      return;
    }
    if (!looksLikeWebsite(website)) {
      setError('Enter a website like yourvenue.ca.');
      return;
    }
    if (!looksLikeEmail(businessEmail)) {
      setError('Enter a business email we can verify.');
      return;
    }

    try {
      await apply.mutateAsync({
        business_name: businessName.trim(),
        website: normalizeWebsite(website),
        business_email: businessEmail.trim(),
        phone: phone.trim() || null,
        city,
        kind,
      });
      router.replace('/business');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <AuthScreen
      title="Become a business"
      subtitle="Post as a venue, promoter, or shop. Digital proof only."
    >
      <DigitalProofNote />

      <AuthField
        label="BUSINESS NAME"
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="Harbourfront Centre"
        autoCapitalize="words"
      />
      <AuthField
        label="WEBSITE"
        value={website}
        onChangeText={setWebsite}
        placeholder="https://harbourfrontcentre.com"
        autoCapitalize="none"
        keyboardType="url"
      />
      <AuthField
        label="BUSINESS EMAIL"
        value={businessEmail}
        onChangeText={setBusinessEmail}
        placeholder="hello@harbourfrontcentre.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      {domainHint === 'match' ? (
        <Text
          style={[
            typography.caption,
            { color: colors.success, marginTop: -spacing.md, marginBottom: spacing.lg },
          ]}
        >
          Email domain matches your website — that’s the strongest digital proof.
        </Text>
      ) : null}
      {domainHint === 'mismatch' ? (
        <Text
          style={[
            typography.caption,
            { color: colors.warning, marginTop: -spacing.md, marginBottom: spacing.lg },
          ]}
        >
          Use an email on the same domain as your website when you can. We’ll still
          send a verification link.
        </Text>
      ) : null}

      <AuthField
        label="PHONE (OPTIONAL)"
        value={phone}
        onChangeText={setPhone}
        placeholder="416-555-0100"
        keyboardType="phone-pad"
      />

      <Text
        style={[
          typography.caption,
          {
            color: colors.textMuted,
            fontWeight: '700',
            letterSpacing: 0.6,
            marginBottom: spacing.sm,
          },
        ]}
      >
        CITY
      </Text>
      <View style={[styles.chipRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
        {SW_ONTARIO_CITIES.map((name) => {
          const selected = city === name;
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCity(name)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: selected ? colors.onPrimary : colors.textSecondary,
                    fontWeight: '700',
                  },
                ]}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text
        style={[
          typography.caption,
          {
            color: colors.textMuted,
            fontWeight: '700',
            letterSpacing: 0.6,
            marginBottom: spacing.sm,
          },
        ]}
      >
        WHAT YOU ARE
      </Text>
      <View style={[styles.chipRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
        {BUSINESS_KINDS.map((value) => {
          const selected = kind === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setKind(value)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: selected ? colors.onPrimary : colors.textSecondary,
                    fontWeight: '700',
                  },
                ]}
              >
                {BUSINESS_KIND_LABELS[value]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={[typography.body, { color: colors.danger, marginBottom: spacing.md }]}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Submit business application"
        onPress={() => void onSubmit()}
        disabled={apply.isPending}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            opacity: apply.isPending ? 0.7 : 1,
          },
        ]}
      >
        {apply.isPending ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Send verification email
          </Text>
        )}
      </Pressable>
    </AuthScreen>
  );
}

export default function BecomeBusinessScreen() {
  const { colors, typography, radius } = useTheme();
  const { isSignedIn, status } = useAuth();
  const router = useRouter();
  const businessQuery = useMyBusiness(isSignedIn);
  const existing = businessQuery.data;
  const blockingStatus =
    existing && existing.status !== 'rejected' ? existing.status : null;

  if (status === 'loading' || (isSignedIn && businessQuery.isLoading)) {
    return (
      <AuthScreen title="Become a business">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }

  if (!isSignedIn) {
    return (
      <AuthScreen
        title="Become a business"
        subtitle="Sign in to apply with a business email. No ID selfie required."
      >
        <DigitalProofNote />
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

  if (blockingStatus) {
    return (
      <AuthScreen
        title="Become a business"
        subtitle="You already have an application in progress."
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

  return <ApplyForm initial={existing} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
