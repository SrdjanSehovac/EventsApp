import type { EventListItem } from '../types/events';

const MAX_SPAN_DAYS = 31;

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseEventDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeekSunday(date: Date): Date {
  return addDays(startOfLocalDay(date), -date.getDay());
}

export type CalendarCell = {
  date: Date;
  key: string;
  inMonth: boolean;
};

export function monthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(start, index);
    cells.push({
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === month,
    });
  }

  return cells;
}

export function weekCells(anchor: Date): CalendarCell[] {
  const start = startOfWeekSunday(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      key: toDateKey(date),
      inMonth: true,
    };
  });
}

function eventDayKeys(item: EventListItem): string[] {
  const start = parseEventDate(item.starts_at);
  if (!start) return [];

  const startDay = startOfLocalDay(start);
  const endRaw = parseEventDate(item.ends_at);
  const endDay = endRaw ? startOfLocalDay(endRaw) : startDay;

  if (endDay.getTime() <= startDay.getTime()) {
    return [toDateKey(startDay)];
  }

  const keys: string[] = [];
  let cursor = startDay;
  for (let i = 0; i <= MAX_SPAN_DAYS; i += 1) {
    keys.push(toDateKey(cursor));
    if (sameDay(cursor, endDay)) break;
    cursor = addDays(cursor, 1);
  }
  return keys;
}

export function groupEventsByDay(
  items: EventListItem[],
): Map<string, EventListItem[]> {
  const grouped = new Map<string, EventListItem[]>();

  const sorted = [...items].sort((a, b) => {
    const aTime = a.starts_at ? new Date(a.starts_at).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.starts_at ? new Date(b.starts_at).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  for (const item of sorted) {
    const keys = eventDayKeys(item);
    for (const key of keys) {
      const existing = grouped.get(key);
      if (existing) existing.push(item);
      else grouped.set(key, [item]);
    }
  }

  return grouped;
}

export function undatedEvents(items: EventListItem[]): EventListItem[] {
  return items.filter((item) => !parseEventDate(item.starts_at));
}

export function formatMonthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function formatWeekTitle(anchor: Date): string {
  const start = startOfWeekSunday(anchor);
  const end = addDays(start, 6);
  const startMonth = start.toLocaleDateString(undefined, { month: 'short' });
  const endMonth = end.toLocaleDateString(undefined, { month: 'short' });
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
}

export function formatDayHeading(date: Date): string {
  const today = startOfLocalDay(new Date());
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, addDays(today, 1))) return 'Tomorrow';
  if (sameDay(date, addDays(today, -1))) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatEventTime(startsAt?: string | null): string {
  const date = parseEventDate(startsAt);
  if (!date) return 'Time TBD';
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
