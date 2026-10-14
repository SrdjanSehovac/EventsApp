import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AuthField, AuthScreen, DigitalProofNote, SelectField } from '../src/components';
import { PRODUCT_CITIES, buildCityOptions } from '../src/config/cities';
import { domainsAlign, looksLikeEmail, looksLikeWebsite, normalizeWebsite } from '../src/business/proof';
import { useApplyAsBusiness, useAuth, useMyBusiness } from '../src/hooks';
import { useTheme } from '../src/theme';
import {
  BUSINESS_KIND_LABELS,
  BUSINESS_KINDS,
  type BusinessKind,
  type BusinessProfile,
} from '../src/types/business';
import { friendlyPublicError } from '../src/utils/publicError';

function errorMessage(error: unknown) {
  return friendlyPublicError(error, "Couldn't submit the application. Please try again.");
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
  const [socialUrl, setSocialUrl] = useState(initial?.social_url ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [businessNumber, setBusinessNumber] = useState(initial?.business_number ?? '');
  const [businessEmail, setBusinessEmail] = useState(initial?.business_email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [city, setCity] = useState<string>(initial?.city ?? PRODUCT_CITIES[0].name);
  const cityOptions = useMemo(() => buildCityOptions([], { includeAny: false }), []);
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
      setError('Organizer name is required.');
      return;
    }
    if (!website.trim() && !socialUrl.trim()) {
      setError('Add a website or a social media link.');
      return;
    }
    if (website.trim() && !looksLikeWebsite(website)) {
      setError('Enter a website like yourvenue.ca.');
      return;
    }
    if (socialUrl.trim() && !looksLikeWebsite(socialUrl)) {
      setError('Enter a social link like instagram.com/yourvenue.');
      return;
    }
    if (!looksLikeEmail(businessEmail)) {
      setError('Enter a work email we can send a code to.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Tell us a little about what you organize (at least a sentence).');
      return;
    }

    try {
      await apply.mutateAsync({
        business_name: businessName.trim(),
        website: website.trim() ? normalizeWebsite(website) : '',
        social_url: socialUrl.trim() ? normalizeWebsite(socialUrl) : null,
        business_email: businessEmail.trim(),
        phone: phone.trim() || null,
        city,
        kind,
        description: description.trim(),
        business_number: businessNumber.trim() || null,
      });
      router.replace('/business');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <AuthScreen
      title="Become an organizer"
      subtitle="Venues, businesses and community groups can post events once a person has reviewed the application."
    >
      <DigitalProofNote />

      <AuthField
        label="ORGANIZER NAME"
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
        label="SOCIAL LINK (IF NO WEBSITE)"
        value={socialUrl}
        onChangeText={setSocialUrl}
        placeholder="instagram.com/yourvenue"
        autoCapitalize="none"
        keyboardType="url"
      />
      <AuthField
        label="WORK EMAIL"
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
          send a code, and a reviewer will take a closer look.
        </Text>
      ) : null}

      <AuthField
        label="ABOUT YOU"
        value={description}
        onChangeText={setDescription}
        placeholder="What kind of events do you run, and where?"
        multiline
      />
      <AuthField
        label="BUSINESS NUMBER (OPTIONAL)"
        value={businessNumber}
        onChangeText={setBusinessNumber}
        placeholder="9-digit CRA business number"
        keyboardType="number-pad"
      />
      <AuthField
        label="PHONE (OPTIONAL)"
        value={phone}
        onChangeText={setPhone}
        placeholder="416-555-0100"
        keyboardType="phone-pad"
      />

      <View style={{ marginBottom: spacing.lg }}>
        <SelectField
          label="City"
          placeholder="Toronto"
          value={city}
          options={cityOptions}
          searchable
          searchPlaceholder="Search cities…"
          onChange={(next) => {
            if (next) setCity(next);
          }}
        />
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
        TYPE
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
        accessibilityLabel="Submit organizer application"
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
            Apply and send code
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
      <AuthScreen title="Become an organizer">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }

  if (!isSignedIn) {
    return (
      <AuthScreen
        title="Become an organizer"
        subtitle="Sign in to apply. No ID selfie required."
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
        title="Become an organizer"
        subtitle="You already have an application. Check its status below."
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View organizer status"
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
