import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../theme';
import type { BusinessProfile } from '../types/business';
import { BUSINESS_KIND_LABELS } from '../types/business';

type BusinessCardProps = {
  profile: BusinessProfile | null | undefined;
  signedIn: boolean;
  loading?: boolean;
  onSignIn: () => void;
};

function statusCopy(profile: BusinessProfile | null | undefined) {
  if (!profile) {
    return {
      title: 'Post as a business',
      subtitle: 'List nights out from your venue or brand with digital proof only.',
      action: 'Become a business',
      href: '/become-business' as const,
      icon: 'storefront-outline' as const,
    };
  }

  if (profile.status === 'pending_email') {
    return {
      title: 'Verify your business email',
      subtitle: `Check ${profile.business_email}. Same domain as your website works best.`,
      action: 'Open status',
      href: '/business' as const,
      icon: 'mail-unread-outline' as const,
    };
  }

  if (profile.status === 'pending_review') {
    return {
      title: 'Application in review',
      subtitle: `${profile.business_name} · digital check, no ID selfie.`,
      action: 'View status',
      href: '/business' as const,
      icon: 'time-outline' as const,
    };
  }

  if (profile.status === 'rejected') {
    return {
      title: 'Application not approved',
      subtitle: profile.rejection_reason || 'You can apply again with a matching business email.',
      action: 'See details',
      href: '/business' as const,
      icon: 'alert-circle-outline' as const,
    };
  }

  return {
    title: 'Posting unlocked',
    subtitle: `${profile.business_name} · ${BUSINESS_KIND_LABELS[profile.kind]} in ${profile.city}`,
    action: 'Submit event',
    href: '/submit-event' as const,
    icon: 'checkmark-circle' as const,
  };
}

export function BusinessCard({
  profile,
  signedIn,
  loading,
  onSignIn,
}: BusinessCardProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const copy = statusCopy(profile);
  const verified = profile?.status === 'verified';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: verified ? colors.primaryMuted : colors.surfaceElevated },
          ]}
        >
          <Ionicons
            name={copy.icon}
            size={16}
            color={verified ? colors.success : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.heading, { color: colors.text, fontSize: 18 }]}>
            {copy.title}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {copy.subtitle}
          </Text>
        </View>
      </View>

      {loading && signedIn ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.action}
          onPress={() => {
            if (!signedIn) {
              onSignIn();
              return;
            }
            router.push(copy.href);
          }}
          style={[
            styles.action,
            {
              backgroundColor: verified ? colors.primary : colors.surfaceElevated,
              borderColor: verified ? colors.primary : colors.border,
              borderRadius: radius.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text
            style={[
              typography.body,
              {
                color: verified ? colors.onPrimary : colors.text,
                fontWeight: '700',
              },
            ]}
          >
            {copy.action}
          </Text>
        </Pressable>
      )}

      {verified ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View business status"
          onPress={() => router.push('/business')}
          style={styles.statusLink}
        >
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            View business status
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusLink: {
    alignItems: 'center',
    marginTop: 10,
    minHeight: 32,
    justifyContent: 'center',
  },
});
