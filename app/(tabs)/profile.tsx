import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ApiError } from '../../src/api/client';
import { SavedCalendar } from '../../src/components/saved/SavedCalendar';
import { SavedDayCard } from '../../src/components/saved/SavedDayCard';
import { MyTickets } from '../../src/components/MyTickets';
import { useAuth, useCalendarAutoSave, useFavourites } from '../../src/hooks';
import { Screen } from '../../src/layout';
import { syncReminders } from '../../src/reminders';
import { useReminderState } from '../../src/reminders/useReminders';
import { useTheme } from '../../src/theme';
import type { EventListItem } from '../../src/types/events';
import { formatEventTime, formatDayHeading, parseEventDate } from '../../src/utils/calendar';
import { eventDetailHref } from '../../src/utils/eventDetail';
import { formatEventPlace } from '../../src/utils/eventFormat';
import { allowedImageUrl } from '../../src/utils/outboundLinks';
import { friendlyPublicError } from '../../src/utils/publicError';
import { countdownLabel, nextUp, splitSaved } from '../../src/utils/savedPlan';

function quietError(error: unknown) {
  if (!error) return true;
  if (error instanceof ApiError && (error.status === 404 || error.status === 501)) return true;
  return error instanceof Error && /failed to fetch|network request failed|load failed/i.test(error.message);
}

/** Re-render each minute so the countdown and "Happening now" stay current. */
function useMinuteClock() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function SavedScreen() {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const router = useRouter();
  const { isSignedIn, status } = useAuth();
  const favouritesQuery = useFavourites(isSignedIn);
  const calendarAutoSave = useCalendarAutoSave();
  const reminders = useReminderState();
  const now = useMinuteClock();
  const [pastOpen, setPastOpen] = useState(false);

  const items = useMemo(() => favouritesQuery.data?.items ?? [], [favouritesQuery.data]);
  const { upcoming, past } = useMemo(() => splitSaved(items, now), [items, now]);
  const hero = useMemo(() => nextUp(items, now), [items, now]);
  const calendarItems = calendarAutoSave.enabled ? upcoming : [];
  const remindersOn = reminders?.enabled ?? true;
  const offList = reminders?.off ?? [];

  useEffect(() => {
    if (items.length) void syncReminders(items).catch(() => undefined);
  }, [items]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxl }}
      >
        <View style={styles.titleRow}>
          <Text style={[typography.title, { color: colors.text, flex: 1 }]}>Saved</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add an event"
            onPress={() => router.push('/contribute')}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account and settings"
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {!isSignedIn && status !== 'loading' ? (
          <View style={[styles.signIn, shadows.soft, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <Ionicons name="heart-outline" size={28} color={colors.primary} />
            <Text style={[typography.heading, { color: colors.text, marginTop: spacing.sm, fontSize: 18 }]}>
              Save events to plan your weeks
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
              Sign in, then tap the heart on any event. It shows up here with a reminder an hour before.
            </Text>
            <Pressable
              onPress={() => router.push('/sign-in')}
              style={[styles.cta, { backgroundColor: colors.primary, borderRadius: radius.full }]}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>Sign in</Text>
            </Pressable>
          </View>
        ) : null}

        {!quietError(favouritesQuery.error) ? (
          <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>
            {friendlyPublicError(favouritesQuery.error, "Couldn't load saved events. Please try again.")}
          </Text>
        ) : null}

        {isSignedIn && favouritesQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : null}

        <MyTickets enabled={isSignedIn} />

        {hero ? <HeroCard item={hero} now={now} /> : null}

        {isSignedIn && !favouritesQuery.isLoading ? (
          <SavedCalendar items={calendarItems} remindersOn={remindersOn} remindersOff={offList} />
        ) : null}

        {past.length ? (
          <View style={{ marginTop: spacing.xl }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: pastOpen }}
              onPress={() => setPastOpen((v) => !v)}
              style={styles.pastHead}
            >
              <Text style={[typography.heading, { color: colors.text, fontSize: 18, flex: 1 }]}>
                Past ({past.length})
              </Text>
              <Ionicons name={pastOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
            </Pressable>
            {pastOpen
              ? past.map((item, i) => (
                  <SavedDayCard key={item.event_id} item={item} index={i} remindersOn={false} reminderOff />
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function HeroCard({ item, now }: { item: EventListItem; now: number }) {
  const { colors, typography, radius, shadows } = useTheme();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const image = allowedImageUrl(item.image_url);
  const start = parseEventDate(item.starts_at);
  const place = formatEventPlace(item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Coming up next: ${item.title}`}
      onPress={() => router.push(eventDetailHref(item.event_id))}
      style={[styles.hero, shadows.card, { borderRadius: radius.xl, backgroundColor: colors.primaryMuted }]}
    >
      {image && !failed ? (
        <Image source={{ uri: image }} onError={() => setFailed(true)} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,20,16,0.55)' }]} />
      <View style={styles.heroBody}>
        <Text style={styles.heroKicker}>COMING UP NEXT</Text>
        <Text numberOfLines={2} style={[typography.heading, { color: '#fff' }]}>{item.title}</Text>
        <Text numberOfLines={1} style={[typography.caption, { color: 'rgba(255,255,255,0.85)', marginTop: 2 }]}>
          {[start ? `${formatDayHeading(start)} · ${formatEventTime(item.starts_at)}` : null, place].filter(Boolean).join(' · ')}
        </Text>
        <View style={[styles.countdown, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
          <Ionicons name="time-outline" size={14} color={colors.onPrimary} />
          <Text style={{ color: colors.onPrimary, fontWeight: '800', fontSize: 13 }}>{countdownLabel(item, now)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  signIn: { alignItems: 'center', padding: 20, marginBottom: 16 },
  cta: { marginTop: 14, paddingHorizontal: 28, paddingVertical: 12 },
  hero: { height: 180, overflow: 'hidden', marginBottom: 20, justifyContent: 'flex-end' },
  heroBody: { padding: 16 },
  heroKicker: { color: '#99F6E4', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, marginTop: 10 },
  pastHead: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
});
