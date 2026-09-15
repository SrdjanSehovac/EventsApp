import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../theme';
import type { SubmittedEvent } from '../types/submissions';

type MySubmissionsProps = {
  items: SubmittedEvent[];
  signedIn: boolean;
  onSignIn: () => void;
};

function formatWhen(startsAt: string) {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(status: SubmittedEvent['status']) {
  if (status === 'local') return 'Saved on device';
  if (status === 'accepted') return 'Accepted';
  if (status === 'rejected') return 'Rejected';
  return 'Pending review';
}

export function MySubmissions({ items, signedIn, onSignIn }: MySubmissionsProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

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
        <View style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="add-circle" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.heading, { color: colors.text, fontSize: 18 }]}>
            My submissions
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            Events you sent in for the catalogue
          </Text>
        </View>
      </View>

      {!signedIn ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in to submit events"
          onPress={onSignIn}
          style={[
            styles.empty,
            { backgroundColor: colors.surfaceElevated, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            Sign in to submit an event and track it here.
          </Text>
        </Pressable>
      ) : items.length === 0 ? (
        <View
          style={[
            styles.empty,
            { backgroundColor: colors.surfaceElevated, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            Nothing submitted yet. Add a night out, market, or show.
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View
            key={item.submission_id}
            style={[
              styles.row,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.md,
                marginTop: spacing.sm,
              },
            ]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {formatWhen(item.starts_at)}
                {item.city ? ` · ${item.city}` : ''}
              </Text>
              <Text style={[typography.caption, { color: colors.primary, marginTop: 2, fontWeight: '700' }]}>
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>
        ))
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Submit an event"
        onPress={() => router.push(signedIn ? '/submit-event' : '/sign-in')}
        style={[
          styles.submitBtn,
          { backgroundColor: colors.primary, borderRadius: radius.md, marginTop: spacing.md },
        ]}
      >
        <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
          Submit an event
        </Text>
      </Pressable>
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
  empty: {
    marginTop: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  submitBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
