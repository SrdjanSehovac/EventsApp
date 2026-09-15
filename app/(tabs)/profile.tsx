import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ApiError } from '../../src/api/client';
import { BusinessCard } from '../../src/components/BusinessCard';
import { MyCalendar } from '../../src/components/MyCalendar';
import { MySubmissions } from '../../src/components/MySubmissions';
import { useAuth, useFavourites, useMyBusiness, useMySubmissions } from '../../src/hooks';
import { Screen } from '../../src/layout';
import { useTheme } from '../../src/theme';

function shouldShowFavouritesError(error: unknown) {
  if (!error) return false;
  if (error instanceof ApiError && (error.status === 404 || error.status === 501)) {
    return false;
  }
  if (
    error instanceof Error &&
    /failed to fetch|network request failed|load failed/i.test(error.message)
  ) {
    return false;
  }
  return true;
}

export default function ProfileScreen() {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const { user, isSignedIn, status, signOut } = useAuth();
  const router = useRouter();
  const favouritesQuery = useFavourites(isSignedIn);
  const submissionsQuery = useMySubmissions(isSignedIn);
  const businessQuery = useMyBusiness(isSignedIn);
  const initial = user?.display_name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl }}
      >
        <Text style={[typography.title, { color: colors.text }]}>Profile</Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
          ]}
        >
          Account, calendar, submissions, and business posting
        </Text>

        <View
          style={[
            styles.accountCard,
            shadows.soft,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
            ]}
          >
            {isSignedIn ? (
              <Text style={[typography.heading, { color: colors.primary }]}>{initial}</Text>
            ) : (
              <Ionicons name="person" size={22} color={colors.primary} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {status === 'loading' ? (
              <ActivityIndicator color={colors.primary} />
            ) : isSignedIn && user ? (
              <>
                <Text style={[typography.heading, { color: colors.text }]}>
                  {user.display_name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {user.email}
                </Text>
              </>
            ) : (
              <>
                <Text style={[typography.heading, { color: colors.text }]}>
                  Welcome
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  Sign in to save favourites across devices.
                </Text>
              </>
            )}
          </View>
        </View>

        {isSignedIn ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={() => void signOut()}
            style={[
              styles.secondaryBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
              Sign out
            </Text>
          </Pressable>
        ) : (
          <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              onPress={() => router.push('/sign-in')}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, borderRadius: radius.md },
              ]}
            >
              <Text
                style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}
              >
                Sign in
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create account"
              onPress={() => router.push('/sign-up')}
              style={[
                styles.secondaryBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
                Create account
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{ marginBottom: spacing.lg }}>
          <BusinessCard
            profile={businessQuery.data}
            signedIn={isSignedIn}
            loading={isSignedIn && businessQuery.isLoading}
            onSignIn={() => router.push('/sign-in')}
          />
        </View>

        {shouldShowFavouritesError(favouritesQuery.error) ? (
          <Text
            style={[
              typography.caption,
              { color: colors.danger, marginBottom: spacing.md },
            ]}
          >
            {favouritesQuery.error instanceof Error
              ? favouritesQuery.error.message
              : 'Could not load saved events.'}
          </Text>
        ) : null}

        {isSignedIn && favouritesQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />
        ) : (
          <MyCalendar
            items={favouritesQuery.data?.items ?? []}
            signedIn={isSignedIn}
            onSignIn={() => router.push('/sign-in')}
          />
        )}

        <View style={{ height: spacing.lg }} />

        <MySubmissions
          items={submissionsQuery.data ?? []}
          signedIn={isSignedIn}
          onSignIn={() => router.push('/sign-in')}
        />

        {isSignedIn ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all favourites"
            onPress={() => router.push('/favourites')}
            style={[
              styles.linkRow,
              {
                marginTop: spacing.md,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
              },
            ]}
          >
            <Ionicons name="heart" size={18} color={colors.primary} />
            <Text
              style={[
                typography.body,
                { color: colors.text, fontWeight: '600', flex: 1, marginLeft: spacing.sm },
              ]}
            >
              All favourites
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Admin tools"
          onPress={() => router.push('/admin')}
          style={[
            styles.linkRow,
            {
              marginTop: spacing.lg,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
            },
          ]}
        >
          <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
              Admin tools
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Pipeline health and catalog insights
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
