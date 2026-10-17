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
      title: 'Post events as an organizer',
      subtitle: 'Venues, businesses and community groups can apply. Anyone can suggest an event.',
      action: 'Become an organizer or suggest',
      href: '/contribute' as const,
      icon: 'storefront-outline' as const,
    };
  }

  if (profile.status === 'pending_email') {
    return {
      title: 'Organizer application: pending',
      subtitle: `Confirm the code sent to ${profile.business_email}.`,
      action: 'Open status',
      href: '/business' as const,
      icon: 'mail-unread-outline' as const,
    };
  }

  if (profile.status === 'pending_review') {
    return {
      title: 'Organizer application: pending review',
      subtitle: `${profile.business_name} · a person reviews every application.`,
      action: 'View status',
      href: '/business' as const,
      icon: 'time-outline' as const,
    };
  }

  if (profile.status === 'rejected') {
    return {
      title: 'Organizer application: not approved',
      subtitle: profile.rejection_reason || 'You can apply again, or suggest events instead.',
      action: 'See details',
      href: '/business' as const,
      icon: 'alert-circle-outline' as const,
    };
  }

  if (profile.suspended) {
    return {
      title: 'Organizer posting paused',
      subtitle: `${profile.business_name} can’t post right now.`,
      action: 'See details',
      href: '/business' as const,
      icon: 'pause-circle-outline' as const,
    };
  }

  return {
    title: 'Verified organizer',
    subtitle: `${profile.business_name} · ${BUSINESS_KIND_LABELS[profile.kind]} in ${profile.city}`,
    action: 'Post an event',
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
  const verified = profile?.status === 'verified' && !profile.suspended;

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
          accessibilityLabel="View organizer status"
          onPress={() => router.push('/business')}
          style={styles.statusLink}
        >
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            View organizer status
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
