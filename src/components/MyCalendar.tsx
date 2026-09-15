import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import type { EventListItem } from '../types/events';
import { FavouriteButton } from './FavouriteButton';

type MyCalendarProps = {
  items: EventListItem[];
  signedIn: boolean;
  onSignIn: () => void;
};

type CalendarGroup = {
  key: string;
  label: string;
  items: EventListItem[];
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function groupLabel(startsAt: string | null | undefined, now: Date): string {
  if (!startsAt) return 'Date TBD';
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return 'Date TBD';

  const eventDay = startOfDay(date);
  const today = startOfDay(now);
  const tomorrow = today + 24 * 60 * 60 * 1000;

  if (eventDay === today) return 'Today';
  if (eventDay === tomorrow) return 'Tomorrow';
  if (eventDay < today) return 'Past';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(startsAt?: string | null) {
  if (!startsAt) return 'Time TBD';
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return 'Time TBD';
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildGroups(items: EventListItem[]): CalendarGroup[] {
  const now = new Date();
  const buckets = new Map<string, CalendarGroup>();

  const sorted = [...items].sort((a, b) => {
    const aTime = a.starts_at ? new Date(a.starts_at).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.starts_at ? new Date(b.starts_at).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  for (const item of sorted) {
    const label = groupLabel(item.starts_at, now);
    const existing = buckets.get(label);
    if (existing) {
      existing.items.push(item);
    } else {
      buckets.set(label, { key: label, label, items: [item] });
    }
  }

  const groups = [...buckets.values()];
  groups.sort((a, b) => {
    if (a.label === 'Past') return 1;
    if (b.label === 'Past') return -1;
    if (a.label === 'Date TBD') return 1;
    if (b.label === 'Date TBD') return -1;
    return 0;
  });
  return groups;
}

export function MyCalendar({ items, signedIn, onSignIn }: MyCalendarProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const groups = buildGroups(items);

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
            { backgroundColor: colors.primaryMuted },
          ]}
        >
          <Ionicons name="calendar" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.heading, { color: colors.text, fontSize: 18 }]}>
            My Calendar
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginTop: 2 },
            ]}
          >
            Favourited events, grouped by date
          </Text>
        </View>
      </View>

      {!signedIn ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in to see your calendar"
          onPress={onSignIn}
          style={[
            styles.empty,
            { backgroundColor: colors.surfaceElevated, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            Sign in to keep a calendar of events you save.
          </Text>
        </Pressable>
      ) : groups.length === 0 ? (
        <View
          style={[
            styles.empty,
            { backgroundColor: colors.surfaceElevated, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            Save events with the heart to fill your calendar.
          </Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.key} style={{ marginTop: spacing.md }}>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.primary,
                  fontWeight: '700',
                  letterSpacing: 0.4,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              {group.label.toUpperCase()}
            </Text>
            {group.items.map((item) => (
              <View
                key={item.event_id}
                style={[
                  styles.row,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.sm }}>
                  <Text
                    numberOfLines={1}
                    style={[typography.body, { color: colors.text, fontWeight: '600' }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    {formatTime(item.starts_at)}
                    {item.city || item.neighbourhood
                      ? ` · ${[item.neighbourhood, item.city].filter(Boolean).join(', ')}`
                      : ''}
                  </Text>
                </View>
                <FavouriteButton item={item} />
              </View>
            ))}
          </View>
        ))
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 6,
  },
});
