import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { EventListItem } from '../types/events';
import { DEFAULT_REMINDER_MINUTES, reminderFireDate } from '../utils/savedPlan';
import { formatEventTime } from '../utils/calendar';

const KEY = 'eventsapp.reminders.v1';

export type ReminderState = {
  /** Global switch in Account & Settings. Default on. */
  enabled: boolean;
  /** Events the user switched the reminder off for. */
  off: string[];
  /** eventId -> scheduled notification id. */
  scheduled: Record<string, string>;
};

const EMPTY: ReminderState = { enabled: true, off: [], scheduled: {} };
const supported = Platform.OS === 'ios' || Platform.OS === 'android';
const listeners = new Set<(state: ReminderState) => void>();
let cached: ReminderState | null = null;

export async function loadReminders(): Promise<ReminderState> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cached = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<ReminderState>) } : { ...EMPTY };
  } catch {
    cached = { ...EMPTY };
  }
  return cached;
}

async function save(next: ReminderState) {
  cached = next;
  listeners.forEach((fn) => fn(next));
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable
  }
}

export function subscribeReminders(fn: (state: ReminderState) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Asked at the first save or toggle, never on launch. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function cancelId(id: string | undefined) {
  if (!supported || !id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already fired or gone
  }
}

/** Schedule the 1h-before reminder when it applies. Safe to call repeatedly. */
export async function scheduleReminder(item: EventListItem): Promise<void> {
  const state = await loadReminders();
  if (!supported || !state.enabled || state.off.includes(item.event_id)) return;
  const fire = reminderFireDate(item.starts_at, DEFAULT_REMINDER_MINUTES);
  if (!fire) return;
  if (!(await ensureNotificationPermission())) return;
  await cancelId(state.scheduled[item.event_id]);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: item.title,
      body: `Starts in 1 hour${item.starts_at ? ` · ${formatEventTime(item.starts_at)}` : ''}`,
      data: { eventId: item.event_id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
  });
  const latest = await loadReminders();
  await save({ ...latest, scheduled: { ...latest.scheduled, [item.event_id]: id } });
}

export async function cancelReminder(eventId: string): Promise<void> {
  const state = await loadReminders();
  await cancelId(state.scheduled[eventId]);
  const scheduled = { ...state.scheduled };
  delete scheduled[eventId];
  await save({ ...state, scheduled });
}

/** Per-event switch on a saved event card. */
export async function setEventReminder(item: EventListItem, on: boolean): Promise<void> {
  const state = await loadReminders();
  const off = state.off.filter((id) => id !== item.event_id);
  if (!on) off.push(item.event_id);
  await save({ ...state, off });
  if (on) await scheduleReminder(item);
  else await cancelReminder(item.event_id);
}

/** Global switch: cancels everything when off, reschedules saved events when on. */
export async function setRemindersEnabled(on: boolean, saved: EventListItem[]): Promise<void> {
  const state = await loadReminders();
  await save({ ...state, enabled: on });
  if (on) {
    for (const item of saved) await scheduleReminder(item);
  } else {
    for (const id of Object.keys(state.scheduled)) await cancelReminder(id);
  }
}

/** Keep scheduled reminders in step with the saved list (e.g. saved on another device). */
export async function syncReminders(saved: EventListItem[]): Promise<void> {
  const state = await loadReminders();
  if (!supported || !state.enabled) return;
  const ids = new Set(saved.map((item) => item.event_id));
  for (const id of Object.keys(state.scheduled)) {
    if (!ids.has(id)) await cancelReminder(id);
  }
  const current = await loadReminders();
  // Only schedule without prompting: sync never triggers the permission ask.
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  for (const item of saved) {
    if (!current.scheduled[item.event_id]) await scheduleReminder(item);
  }
}

export function configureNotificationDisplay() {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
