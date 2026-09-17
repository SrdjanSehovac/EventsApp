import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import type { EventListItem } from '../types/events';
import {
  WEEKDAY_LABELS,
  addDays,
  formatDayHeading,
  formatEventTime,
  formatMonthTitle,
  formatWeekTitle,
  groupEventsByDay,
  monthCells,
  sameDay,
  startOfLocalDay,
  toDateKey,
  undatedEvents,
  weekCells,
} from '../utils/calendar';
import { FavouriteButton } from './FavouriteButton';

type CalendarMode = 'month' | 'week';

type MyCalendarProps = {
  items: EventListItem[];
  signedIn: boolean;
  onSignIn: () => void;
};

export function MyCalendar({ items, signedIn, onSignIn }: MyCalendarProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const [mode, setMode] = useState<CalendarMode>('month');
  const [selected, setSelected] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const byDay = useMemo(() => groupEventsByDay(items), [items]);
  const undated = useMemo(() => undatedEvents(items), [items]);
  const selectedKey = toDateKey(selected);
  const dayItems = byDay.get(selectedKey) ?? [];
  const cells = mode === 'month'
    ? monthCells(visibleMonth.year, visibleMonth.month)
    : weekCells(selected);

  const showingTodayMonth =
    visibleMonth.year === today.getFullYear() &&
    visibleMonth.month === today.getMonth();
  const showJumpToday =
    !sameDay(selected, today) || (mode === 'month' && !showingTodayMonth);

  function selectDay(date: Date) {
    const next = startOfLocalDay(date);
    setSelected(next);
    setVisibleMonth({ year: next.getFullYear(), month: next.getMonth() });
  }

  function shift(delta: number) {
    if (mode === 'week') {
      selectDay(addDays(selected, delta * 7));
      return;
    }
    const next = new Date(visibleMonth.year, visibleMonth.month + delta, 1);
    setVisibleMonth({ year: next.getFullYear(), month: next.getMonth() });
    if (
      selected.getMonth() !== next.getMonth() ||
      selected.getFullYear() !== next.getFullYear()
    ) {
      if (today.getMonth() === next.getMonth() && today.getFullYear() === next.getFullYear()) {
        setSelected(today);
      } else {
        setSelected(next);
      }
    }
  }

  function goToday() {
    selectDay(today);
  }

  const title =
    mode === 'month'
      ? formatMonthTitle(visibleMonth.year, visibleMonth.month)
      : formatWeekTitle(selected);

  return (
    <View
      style={[
        styles.card,
        shadows.soft,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}
        >
          <Ionicons name="calendar" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.heading, { color: colors.text, fontSize: 18 }]}>
            My calendar
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginTop: 2 },
            ]}
          >
            Saved events on their dates
          </Text>
        </View>
        <View
          style={[
            styles.modeSwitch,
            { backgroundColor: colors.surfaceElevated, borderRadius: radius.full },
          ]}
        >
          {(['month', 'week'] as const).map((option) => {
            const active = mode === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option} view`}
                onPress={() => setMode(option)}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: active ? colors.primary : 'transparent',
                    borderRadius: radius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: active ? colors.onPrimary : colors.textSecondary,
                      fontWeight: '800',
                      textTransform: 'capitalize',
                    },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'week' ? 'Previous week' : 'Previous month'}
          onPress={() => shift(-1)}
          hitSlop={8}
          style={[styles.navBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text
          style={[
            typography.body,
            { color: colors.text, fontWeight: '700', flex: 1, textAlign: 'center' },
          ]}
        >
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'week' ? 'Next week' : 'Next month'}
          onPress={() => shift(1)}
          hitSlop={8}
          style={[styles.navBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      {showJumpToday ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Jump to today"
          onPress={goToday}
          style={styles.todayJump}
        >
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '800' }]}>
            Jump to today
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text
            key={label}
            style={[
              typography.caption,
              styles.weekday,
              { color: colors.textMuted, fontWeight: '700' },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={mode === 'week' ? styles.weekGrid : styles.monthGrid}>
        {cells.map((cell) => {
          const count = byDay.get(cell.key)?.length ?? 0;
          const isSelected = sameDay(cell.date, selected);
          const isToday = sameDay(cell.date, today);
          const muted = mode === 'month' && !cell.inMonth;

          return (
            <Pressable
              key={cell.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${cell.date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}${count ? `, ${count} saved event${count === 1 ? '' : 's'}` : ''}`}
              onPress={() => selectDay(cell.date)}
              style={[
                mode === 'week' ? styles.weekCell : styles.monthCell,
                isSelected && {
                  backgroundColor: colors.primaryMuted,
                  borderRadius: radius.md,
                },
              ]}
            >
              <View
                style={[
                  styles.dayNumber,
                  isToday && !isSelected
                    ? { borderColor: colors.accent, borderWidth: 1.5 }
                    : { borderColor: 'transparent', borderWidth: 1.5 },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      fontWeight: '800',
                      color: isSelected
                        ? colors.onPrimary
                        : muted
                          ? colors.textMuted
                          : colors.text,
                      opacity: muted && !isSelected ? 0.55 : 1,
                    },
                  ]}
                >
                  {cell.date.getDate()}
                </Text>
              </View>
              <View style={styles.dots}>
                {Array.from({ length: Math.min(count, 3) }).map((_, index) => (
                  <View
                    key={`${cell.key}-dot-${index}`}
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? colors.primary : colors.accent },
                    ]}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.dayPanel, { borderTopColor: colors.hairline }]}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
          {formatDayHeading(selected)}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
          ]}
        >
          {signedIn
            ? dayItems.length
              ? `${dayItems.length} saved event${dayItems.length === 1 ? '' : 's'}`
              : 'No saved events this day'
            : 'Sign in to place saved events on days'}
        </Text>

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
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center' },
              ]}
            >
              Sign in to keep a calendar of events you save.
            </Text>
          </Pressable>
        ) : dayItems.length === 0 ? (
          <View
            style={[
              styles.empty,
              { backgroundColor: colors.surfaceElevated, borderRadius: radius.md },
            ]}
          >
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center' },
              ]}
            >
              Heart an event and it will land on its date here.
            </Text>
          </View>
        ) : (
          dayItems.map((item) => (
            <CalendarEventRow key={item.event_id} item={item} />
          ))
        )}
      </View>

      {signedIn && undated.length > 0 ? (
        <View style={{ marginTop: spacing.md }}>
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
            DATE TBD
          </Text>
          {undated.map((item) => (
            <CalendarEventRow key={item.event_id} item={item} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CalendarEventRow({ item }: { item: EventListItem }) {
  const { colors, typography, spacing, radius } = useTheme();
  const place = [item.neighbourhood, item.city].filter(Boolean).join(', ');

  async function openSource() {
    if (!item.source_url) return;
    const canOpen = await Linking.canOpenURL(item.source_url);
    if (canOpen) await Linking.openURL(item.source_url);
  }

  return (
    <View
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={openSource}
        disabled={!item.source_url}
        style={{ flex: 1, minWidth: 0, paddingRight: spacing.sm }}
      >
        <Text
          numberOfLines={1}
          style={[typography.body, { color: colors.text, fontWeight: '600' }]}
        >
          {item.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
        >
          {formatEventTime(item.starts_at)}
          {place ? ` · ${place}` : ''}
        </Text>
      </Pressable>
      <FavouriteButton item={item} variant="plain" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
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
  modeSwitch: {
    flexDirection: 'row',
    padding: 3,
  },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 58,
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayJump: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekGrid: {
    flexDirection: 'row',
  },
  monthCell: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 44,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 64,
  },
  dayNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    height: 8,
    marginTop: 2,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayPanel: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  empty: {
    paddingVertical: 16,
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
