/**
 * Device-clock timing for an event.
 *
 * Ended when `ends_at` is before now. If `ends_at` is missing and the start
 * is a timestamp, the event runs for three hours. A date-only start with no
 * end lasts through the end of that local day. Comparison uses the device
 * clock (`Date.now()`), not the event's venue timezone.
 */

/** Open-ended events (a start time and no `ends_at`) stay up for this long. */
export const OPEN_EVENT_MS = 3 * 60 * 60 * 1000;

export type EventPhase = 'upcoming' | 'live' | 'ended' | 'unscheduled';

export type TimedEvent = {
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string | null;
  occurrences?: Array<{ starts_at?: string | null; ends_at?: string | null }> | null;
};

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseStartMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const dateOnly = DATE_ONLY.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    return new Date(year, month, day, 0, 0, 0, 0).getTime();
  }
  const ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
}

function parseEndMs(
  endsAt: string | null | undefined,
  startsAt: string | null | undefined,
  startMs: number,
): number {
  if (endsAt && endsAt.trim()) {
    const trimmed = endsAt.trim();
    const dateOnly = DATE_ONLY.exec(trimmed);
    if (dateOnly) {
      const year = Number(dateOnly[1]);
      const month = Number(dateOnly[2]) - 1;
      const day = Number(dateOnly[3]);
      return new Date(year, month, day, 23, 59, 59, 999).getTime();
    }
    const ms = Date.parse(trimmed);
    if (Number.isFinite(ms)) return ms;
  }
  if (startsAt && DATE_ONLY.test(startsAt.trim())) {
    const start = new Date(startMs);
    return new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      23,
      59,
      59,
      999,
    ).getTime();
  }
  return startMs + OPEN_EVENT_MS;
}

function phaseOfWindow(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  nowMs: number,
): EventPhase {
  const startMs = parseStartMs(startsAt);
  if (startMs == null) return 'unscheduled';
  const endMs = parseEndMs(endsAt, startsAt, startMs);
  if (nowMs < startMs) return 'upcoming';
  if (nowMs < endMs) return 'live';
  return 'ended';
}

/** Upcoming, in progress, already over, or no usable time. */
export function eventPhase(event: TimedEvent, nowMs: number = Date.now()): EventPhase {
  if (event.status === 'ended') return 'ended';
  const windows = [event, ...(event.occurrences ?? [])];
  let sawTime = false;
  let upcoming = false;
  let live = false;
  for (const window of windows) {
    const phase = phaseOfWindow(window.starts_at, window.ends_at, nowMs);
    if (phase === 'unscheduled') continue;
    sawTime = true;
    if (phase === 'live') live = true;
    else if (phase === 'upcoming') upcoming = true;
  }
  if (!sawTime) return 'unscheduled';
  if (live) return 'live';
  if (upcoming) return 'upcoming';
  return 'ended';
}

export function isEventEnded(event: TimedEvent, nowMs: number = Date.now()): boolean {
  return eventPhase(event, nowMs) === 'ended';
}

/** Started and not yet ended, including the three-hour fallback. */
export function isEventLive(
  event: TimedEvent,
  nowMs: number = Date.now(),
): boolean {
  return eventPhase(event, nowMs) === 'live';
}

/**
 * Day-window presets keep earlier events in the window. Finished ones sort
 * after upcoming and in-progress rows, without changing order inside either group.
 */
export function withEndedLast<T extends TimedEvent>(
  items: readonly T[],
  nowMs: number = Date.now(),
): T[] {
  const open: T[] = [];
  const ended: T[] = [];
  for (const item of items) {
    if (isEventEnded(item, nowMs)) ended.push(item);
    else open.push(item);
  }
  if (ended.length === 0) return [...items];
  return [...open, ...ended];
}
