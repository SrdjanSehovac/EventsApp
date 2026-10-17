import type { EventListItem } from '../types/events';
import { parseEventDate } from './calendar';
import { eventPhase } from './eventLive';

export const DEFAULT_REMINDER_MINUTES = 60;

/** Upcoming (and happening now) first by start time; ended ones in Past, newest first. */
export function splitSaved(items: EventListItem[], nowMs = Date.now()) {
  const upcoming: EventListItem[] = [];
  const past: EventListItem[] = [];
  for (const item of items) {
    if (eventPhase(item, nowMs) === 'ended') past.push(item);
    else upcoming.push(item);
  }
  const t = (item: EventListItem) =>
    parseEventDate(item.starts_at)?.getTime() ?? Number.POSITIVE_INFINITY;
  upcoming.sort((a, b) => t(a) - t(b));
  past.sort((a, b) => t(b) - t(a));
  return { upcoming, past };
}

/** The hero card: the soonest saved event that has not ended and has a date. */
export function nextUp(items: EventListItem[], nowMs = Date.now()): EventListItem | null {
  return (
    splitSaved(items, nowMs).upcoming.find((item) => parseEventDate(item.starts_at)) ?? null
  );
}

/** "Starts in 2 days", "Starts in 3 hours", "Starts in 20 min", "Happening now". */
export function countdownLabel(item: EventListItem, nowMs = Date.now()): string {
  const phase = eventPhase(item, nowMs);
  if (phase === 'live') return 'Happening now';
  if (phase === 'ended') return 'Ended';
  const start = parseEventDate(item.starts_at);
  if (!start) return 'Date to be announced';
  const diff = start.getTime() - nowMs;
  if (diff <= 0) return 'Starting now';
  const min = Math.round(diff / 60_000);
  if (min < 60) return `Starts in ${Math.max(1, min)} min`;
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return `Starts in ${hours} hour${hours === 1 ? '' : 's'}`;
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const today = new Date(nowMs);
  today.setHours(0, 0, 0, 0);
  const days = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);
  if (days <= 1) return 'Starts tomorrow';
  if (days < 14) return `Starts in ${days} days`;
  const weeks = Math.round(days / 7);
  return `Starts in ${weeks} weeks`;
}

/** When a reminder should fire, or null when that moment has passed. */
export function reminderFireDate(
  startsAt: string | null | undefined,
  minutesBefore = DEFAULT_REMINDER_MINUTES,
  nowMs = Date.now(),
): Date | null {
  const start = parseEventDate(startsAt);
  if (!start) return null;
  const fire = start.getTime() - minutesBefore * 60_000;
  if (fire <= nowMs + 5_000) return null;
  return new Date(fire);
}

/** Calendar entry window: the listed end, or two hours when the source has none. */
export function calendarWindow(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): { start: Date; end: Date } | null {
  const start = parseEventDate(startsAt);
  if (!start) return null;
  const end = parseEventDate(endsAt);
  return {
    start,
    end: end && end.getTime() > start.getTime() ? end : new Date(start.getTime() + 2 * 3_600_000),
  };
}

/** Month offset between two dates, for swiping and "Today". */
export function monthDelta(from: { year: number; month: number }, to: { year: number; month: number }) {
  return (to.year - from.year) * 12 + (to.month - from.month);
}

/** "Starts in 5 hours", "Starts in 1 hour", "Starts in 30 minutes". */
export function leadLabel(minutes: number): string {
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return `Starts in ${h} hour${h === 1 ? '' : 's'}`;
  }
  return `Starts in ${minutes} minutes`;
}

/** Short toggle label: "5 hours before", "30 min before". */
export function leadOptionLabel(minutes: number): string {
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return `${h} hour${h === 1 ? '' : 's'} before`;
  }
  return `${minutes} min before`;
}
