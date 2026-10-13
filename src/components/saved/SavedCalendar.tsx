import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colorForCategory, useTheme } from '../../theme';
import type { EventListItem } from '../../types/events';
import {
  WEEKDAY_LABELS,
  addDays,
  formatDayHeading,
  formatMonthTitle,
  formatWeekTitle,
  groupEventsByDay,
  monthCells,
  sameDay,
  startOfLocalDay,
  startOfWeekSunday,
  toDateKey,
} from '../../utils/calendar';
import { allowedImageUrl } from '../../utils/outboundLinks';
import { SavedDayCard } from './SavedDayCard';

type Mode = 'month' | 'week';

type Props = {
  items: EventListItem[];
  remindersOn: boolean;
  remindersOff: string[];
};

const SWIPE_PX = 50;

export function SavedCalendar({ items, remindersOn, remindersOff }: Props) {
  const { colors, typography, radius, shadows } = useTheme();
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const [mode, setMode] = useState<Mode>('month');
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const slide = useRef(new Animated.Value(0)).current;

  const byDay = useMemo(() => groupEventsByDay(items), [items]);
  const offSet = useMemo(() => new Set(remindersOff), [remindersOff]);
  const cells = useMemo(() => monthCells(month.year, month.month), [month]);
  const dayItems = byDay.get(toDateKey(selected)) ?? [];
  const weekStart = startOfWeekSunday(selected);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const atToday =
    sameDay(selected, today) &&
    month.year === today.getFullYear() &&
    month.month === today.getMonth();

  function animateShift(dir: number, apply: () => void) {
    slide.setValue(0);
    Animated.timing(slide, { toValue: -dir, duration: 120, useNativeDriver: true }).start(() => {
      apply();
      slide.setValue(dir);
      Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    });
  }

  function shift(dir: number) {
    animateShift(dir, () => {
      if (mode === 'week') {
        const next = addDays(selected, dir * 7);
        setSelected(next);
        setMonth({ year: next.getFullYear(), month: next.getMonth() });
        return;
      }
      const next = new Date(month.year, month.month + dir, 1);
      setMonth({ year: next.getFullYear(), month: next.getMonth() });
      setSelected(
        next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth()
          ? today
          : next,
      );
    });
  }
  const shiftRef = useRef(shift);
  shiftRef.current = shift;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -SWIPE_PX) shiftRef.current(1);
        else if (g.dx >= SWIPE_PX) shiftRef.current(-1);
      },
    }),
  ).current;

  function goToday() {
    setSelected(today);
    setMonth({ year: today.getFullYear(), month: today.getMonth() });
  }

  const translateX = slide.interpolate({ inputRange: [-1, 1], outputRange: [-40, 40] });
  const opacity = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] });

  return (
    <View>
      <View style={styles.headRow}>
        <Pressable accessibilityLabel="Previous" onPress={() => shift(-1)} hitSlop={10} style={styles.arrow}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text, flex: 1, textAlign: 'center', fontSize: 18 }]}>
          {mode === 'month' ? formatMonthTitle(month.year, month.month) : formatWeekTitle(selected)}
        </Text>
        <Pressable accessibilityLabel="Next" onPress={() => shift(1)} hitSlop={10} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.toolRow}>
        <View style={[styles.segment, { backgroundColor: colors.surface, borderRadius: radius.full }]}>
          {(['month', 'week'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m }}
              onPress={() => setMode(m)}
              style={[
                styles.segBtn,
                { borderRadius: radius.full, backgroundColor: mode === m ? colors.primary : 'transparent' },
              ]}
            >
              <Text style={{ fontWeight: '800', fontSize: 13, color: mode === m ? colors.onPrimary : colors.textSecondary }}>
                {m === 'month' ? 'Month' : 'Week'}
              </Text>
            </Pressable>
          ))}
        </View>
        {!atToday ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to today"
            onPress={goToday}
            style={[styles.todayBtn, { borderColor: colors.primary, borderRadius: radius.full }]}
          >
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>Today</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX }], opacity }}>
        {mode === 'month' ? (
          <View style={[styles.grid, shadows.soft, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <View style={styles.week}>
              {WEEKDAY_LABELS.map((d) => (
                <Text key={d} style={[styles.dow, { color: colors.textMuted }]}>{d}</Text>
              ))}
            </View>
            {Array.from({ length: cells.length / 7 }, (_, row) => (
              <View key={row} style={styles.week}>
                {cells.slice(row * 7, row * 7 + 7).map((cell) => {
                  const dayEvents = byDay.get(cell.key) ?? [];
                  const isSel = sameDay(cell.date, selected);
                  const isToday = sameDay(cell.date, today);
                  const thumb =
                    dayEvents.length === 1 ? allowedImageUrl(dayEvents[0].image_url) : null;
                  return (
                    <Pressable
                      key={cell.key}
                      accessibilityRole="button"
                      accessibilityLabel={`${formatDayHeading(cell.date)}${dayEvents.length ? `, ${dayEvents.length} saved` : ''}`}
                      onPress={() => {
                        setSelected(cell.date);
                        if (!cell.inMonth) setMonth({ year: cell.date.getFullYear(), month: cell.date.getMonth() });
                      }}
                      style={[
                        styles.cell,
                        {
                          borderRadius: radius.md,
                          backgroundColor: isSel ? colors.primary : 'transparent',
                          borderColor: isToday && !isSel ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontWeight: isToday || isSel ? '800' : '600',
                          fontSize: 14,
                          color: isSel ? colors.onPrimary : cell.inMonth ? colors.text : colors.textMuted,
                        }}
                      >
                        {cell.date.getDate()}
                      </Text>
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={[styles.thumb, { borderColor: isSel ? colors.onPrimary : colors.primary }]} />
                      ) : (
                        <View style={styles.dots}>
                          {dayEvents.slice(0, 3).map((ev) => (
                            <View
                              key={ev.event_id}
                              style={[styles.dot, { backgroundColor: isSel ? colors.onPrimary : colorForCategory(ev.primary_category) }]}
                            />
                          ))}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View>
            {weekDays.map((day) => {
              const list = byDay.get(toDateKey(day)) ?? [];
              const isToday = sameDay(day, today);
              return (
                <View key={toDateKey(day)} style={styles.agendaDay}>
                  <Text style={[typography.caption, { color: isToday ? colors.primary : colors.textSecondary, marginBottom: 6 }]}>
                    {formatDayHeading(day)}
                  </Text>
                  {list.length ? (
                    list.map((item, i) => (
                      <SavedDayCard key={item.event_id} item={item} index={i} remindersOn={remindersOn} reminderOff={offSet.has(item.event_id)} />
                    ))
                  ) : (
                    <View style={[styles.emptyDay, { borderColor: colors.hairline }]} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Animated.View>

      {mode === 'month' ? (
        <View style={{ marginTop: 16 }}>
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
            {formatDayHeading(selected)}
          </Text>
          {dayItems.length ? (
            dayItems.map((item, i) => (
              <SavedDayCard
                key={`${toDateKey(selected)}-${item.event_id}`}
                item={item}
                index={i}
                remindersOn={remindersOn}
                reminderOff={offSet.has(item.event_id)}
              />
            ))
          ) : (
            <Text style={[typography.body, { color: colors.textMuted }]}>Nothing saved on this day.</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  toolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  segment: { flexDirection: 'row', padding: 3 },
  segBtn: { paddingHorizontal: 16, paddingVertical: 6 },
  todayBtn: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  grid: { padding: 8 },
  week: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', paddingVertical: 6 },
  cell: { flex: 1, aspectRatio: 0.9, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6, margin: 1, borderWidth: 1.5 },
  dots: { flexDirection: 'row', gap: 3, marginTop: 4, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  thumb: { width: 18, height: 18, borderRadius: 9, marginTop: 2, borderWidth: 1 },
  agendaDay: { marginBottom: 12 },
  emptyDay: { height: 1, borderTopWidth: StyleSheet.hairlineWidth },
});
