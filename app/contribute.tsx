import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AuthScreen } from '../src/components';
import { suggestionStatusLabel } from '../src/api/suggestions';
import { useAuth, useMyBusiness, useMySuggestions } from '../src/hooks';
import { useTheme } from '../src/theme';
import { organizerStatusLabel } from '../src/business/status';

type Option = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  status?: string | null;
  onPress: () => void;
};

export default function ContributeScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { isSignedIn, status } = useAuth();
  const business = useMyBusiness(isSignedIn);
  const suggestions = useMySuggestions(isSignedIn);
  const profile = business.data;
  const verified = profile?.status === 'verified' && !profile.suspended;

  if (status === 'loading' || (isSignedIn && business.isLoading)) {
    return (
      <AuthScreen title="Add an event">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }
  if (!isSignedIn) {
    return (
      <AuthScreen title="Add an event" subtitle="Create a free account (or sign in) to post or suggest events.">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/sign-up', params: { reason: 'post' } })}
          style={[styles.button, { backgroundColor: colors.primary, borderRadius: radius.md }]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>Sign in</Text>
        </Pressable>
      </AuthScreen>
    );
  }

  const options: Option[] = verified
    ? [
        {
          icon: 'add-circle-outline',
          title: 'Post an event',
          subtitle: `As ${profile?.business_name}. Shows with a Verified badge.`,
          onPress: () => router.push('/submit-event'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Organizer account',
          subtitle: 'Your application and posting status.',
          status: organizerStatusLabel(profile),
          onPress: () => router.push('/business'),
        },
      ]
    : [
        {
          icon: 'storefront-outline',
          title: 'Become an organizer',
          subtitle: 'For venues, businesses and community groups. Reviewed by a person before you can post.',
          status: organizerStatusLabel(profile),
          onPress: () => router.push(profile && profile.status !== 'rejected' ? '/business' : '/become-business'),
        },
        {
          icon: 'bulb-outline',
          title: 'Suggest an event',
          subtitle: 'Tell us about something that isn’t listed. Our team checks it before it’s added.',
          onPress: () => router.push('/suggest-event'),
        },
      ];

  const items = suggestions.data ?? [];

  return (
    <AuthScreen
      title="Add an event"
      subtitle={
        verified
          ? 'You’re a verified organizer.'
          : 'Only verified organizers can post events directly. Anyone can suggest one.'
      }
    >
      {options.map((opt) => (
        <Pressable
          key={opt.title}
          accessibilityRole="button"
          accessibilityLabel={opt.title}
          onPress={opt.onPress}
          style={[
            styles.option,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.md },
          ]}
        >
          <Ionicons name={opt.icon} size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>{opt.title}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{opt.subtitle}</Text>
            {opt.status ? (
              <Text style={[typography.caption, { color: colors.primary, marginTop: 4, fontWeight: '700' }]}>
                {opt.status}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}

      {items.length ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.6, marginBottom: spacing.sm }]}>
            YOUR SUGGESTIONS
          </Text>
          {items.map((s) => (
            <View key={s.suggestion_id} style={[styles.row, { borderColor: colors.border }]}>
              <Text numberOfLines={1} style={[typography.body, { color: colors.text, flex: 1 }]}>
                {s.title}
              </Text>
              <Text
                style={[
                  typography.caption,
                  {
                    fontWeight: '700',
                    color:
                      s.status === 'rejected' ? colors.danger : s.status === 'promoted' ? colors.success : colors.primary,
                  },
                ]}
              >
                {suggestionStatusLabel(s.status)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
