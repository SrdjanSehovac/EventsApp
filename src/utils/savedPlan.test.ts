import type { EventListItem } from '../types/events';
import { dateKeyFromIso } from './calendar';
import {
  calendarWindow,
  leadLabel,
  leadOptionLabel,
  countdownLabel,
  monthDelta,
  nextUp,
  reminderFireDate,
  splitSaved,
} from './savedPlan';

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${name}: ${a} !== ${e}`);
  console.log(`ok  ${name}`);
}

const now = new Date(2026, 9, 13, 12, 0).getTime();
const at = (d: number, h = 19) => new Date(2026, 9, d, h, 0).toISOString();
const ev = (id: string, starts: string | null, ends: string | null = null): EventListItem => ({
  event_id: id, title: id, source: 's', source_url: 'u', status: 'active', schedule_type: 'single',
  starts_at: starts, ends_at: ends,
});

const items = [ev('later', at(20)), ev('past', at(10), at(10, 22)), ev('soon', at(15)), ev('tba', null)];
const { upcoming, past } = splitSaved(items, now);
check('upcoming sorted soonest first', upcoming.map((i) => i.event_id), ['soon', 'later', 'tba']);
check('ended events go to Past', past.map((i) => i.event_id), ['past']);
check('hero is the soonest dated event', nextUp(items, now)?.event_id, 'soon');
check('countdown in days', countdownLabel(ev('x', at(15)), now), 'Starts in 2 days');
check('countdown tomorrow', countdownLabel(ev('x', at(14)), now), 'Starts tomorrow');
check('countdown hours', countdownLabel(ev('x', at(13, 15)), now), 'Starts in 3 hours');
check('countdown minutes', countdownLabel(ev('x', new Date(now + 20 * 60_000).toISOString()), now), 'Starts in 20 min');
check('live event', countdownLabel(ev('x', at(13, 11), at(13, 14)), now), 'Happening now');
check('reminder 1h before', reminderFireDate(at(15), 60, now)?.getHours(), 18);
check('no reminder in the past', reminderFireDate(at(13, 12), 60, now), null);
check('calendar default 2h', calendarWindow(at(15), null)?.end.getHours(), 21);
check('month delta across years', monthDelta({ year: 2026, month: 10 }, { year: 2027, month: 1 }), 3);

const ninePm = new Date(2026, 9, 15, 21, 0);
check('UTC timestamps land on the local day', dateKeyFromIso(ninePm.toISOString()), '2026-10-15');
check('offset timestamps keep their own date', dateKeyFromIso('2026-10-15T21:00:00-04:00'), '2026-10-15');
check('date-only values are kept', dateKeyFromIso('2026-10-15'), '2026-10-15');
check('lead text 3h', leadLabel(180), 'Starts in 3 hours');
check('lead text 1h', leadLabel(60), 'Starts in 1 hour');
check('lead text 30m', leadLabel(30), 'Starts in 30 minutes');
check('option label', leadOptionLabel(300), '5 hours before');
check('5h reminder skipped when start is 4h away', reminderFireDate(new Date(now + 4 * 3600e3).toISOString(), 300, now), null);
check('30m reminder kept when start is 4h away', reminderFireDate(new Date(now + 4 * 3600e3).toISOString(), 30, now) != null, true);
