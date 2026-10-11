import {
  cleanAddressLine,
  formatAboutBody,
  formatActionLabel,
  formatDetailPrice,
  formatPlaceLines,
  formatScheduleLines,
  isSchemaOrgType,
} from './eventPresentation';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

const zone = 'America/Toronto';

check(
  'same-evening range is one line',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-14T23:30:00.000Z',
    ends_at: '2026-10-15T01:30:00.000Z',
    raw_schedule_text: 'Wednesday, Oct 14 · 7:30 PM to 9:30 PM EDT',
  } as never),
  ['Wed, Oct 14 · 7:30–9:30 PM'],
);

check(
  'iso raw schedule is not shown',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-24T23:00:00.000Z',
    ends_at: '2026-10-25T00:00:00.000Z',
    raw_schedule_text: '2026-10-24T19:00:00-04:00',
  } as never),
  ['Sat, Oct 24 · 7–8 PM'],
);

check(
  'morning into noon keeps both times',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-11T13:00:00Z',
    ends_at: '2026-10-11T16:00:00Z',
    raw_schedule_text: 'Sunday, Oct 11·9:00 AM to 12:00 PMEDT',
  } as never),
  ['Sun, Oct 11 · 9:00 AM – 12:00 PM'],
);

check(
  'am-only range stays compact',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-11T13:00:00Z',
    ends_at: '2026-10-11T15:00:00Z',
  } as never),
  ['Sun, Oct 11 · 9–11 AM'],
);

check(
  'pm-only range stays compact',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-11T17:00:00Z',
    ends_at: '2026-10-11T20:00:00Z',
  } as never),
  ['Sun, Oct 11 · 1–4 PM'],
);

check(
  'crossing noon with minutes spells both clocks',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-11T15:30:00Z',
    ends_at: '2026-10-11T17:30:00Z',
  } as never),
  ['Sun, Oct 11 · 11:30 AM – 1:30 PM'],
);

check(
  'missing end time has no dash',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-11T13:00:00Z',
    ends_at: null,
  } as never),
  ['Sun, Oct 11 · 9 AM'],
);

check(
  'date-only start is all day',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-11',
    ends_at: null,
  } as never),
  ['Sun, Oct 11'],
);

check(
  'date range without hours has no clock',
  formatScheduleLines({
    schedule_type: 'date_range',
    timezone: zone,
    range_start_date: '2026-10-11',
    range_end_date: '2026-10-13',
    daily_start_time: null,
    daily_end_time: null,
  } as never),
  ['Sun, Oct 11 – Tue, Oct 13'],
);

check(
  'multi-day range keeps each clock',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: zone,
    starts_at: '2026-10-11T13:00:00Z',
    ends_at: '2026-10-12T17:00:00Z',
  } as never),
  ['Sun, Oct 11 · 9 AM – Mon, Oct 12 · 1 PM'],
);

check(
  'vancouver morning stays on pacific time',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: 'America/Vancouver',
    starts_at: '2026-10-11T13:00:00Z',
    ends_at: '2026-10-11T16:00:00Z',
  } as never),
  ['Sun, Oct 11 · 6–9 AM'],
);

check(
  'halifax crosses noon',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: 'America/Halifax',
    starts_at: '2026-10-11T13:00:00Z',
    ends_at: '2026-10-11T16:00:00Z',
  } as never),
  ['Sun, Oct 11 · 10:00 AM – 1:00 PM'],
);

check(
  'regina stays on central standard time',
  formatScheduleLines({
    schedule_type: 'one_shot',
    timezone: 'America/Regina',
    starts_at: '2026-10-11T13:00:00Z',
    ends_at: '2026-10-11T16:00:00Z',
  } as never),
  ['Sun, Oct 11 · 7–10 AM'],
);

{
  const proto = Intl.DateTimeFormat.prototype;
  const original = proto.formatToParts;
  proto.formatToParts = () => [
    { type: 'weekday', value: 'Sun' },
    { type: 'month', value: 'Oct' },
    { type: 'day', value: '11' },
    { type: 'dayPeriod', value: '' },
  ];
  try {
    check(
      'missing formatToParts time does not leave a dangling dash',
      formatScheduleLines({
        schedule_type: 'one_shot',
        timezone: zone,
        starts_at: '2026-10-11T13:00:00Z',
        ends_at: '2026-10-11T16:00:00Z',
      } as never),
      ['Sun, Oct 11 · 9:00 AM – 12:00 PM'],
    );
  } finally {
    proto.formatToParts = original;
  }
}

{
  const Real = Intl.DateTimeFormat;
  const Mock = function (
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ) {
    const asksForTime = Boolean(options?.hour && options?.minute && !options.weekday);
    if (asksForTime) {
      return { format: () => '24:00' } as Intl.DateTimeFormat;
    }
    return new Real(locales, options);
  } as unknown as typeof Intl.DateTimeFormat;
  const previous = Intl.DateTimeFormat;
  Intl.DateTimeFormat = Mock;
  try {
    check(
      'midnight reported as 24:00 is 12 AM',
      formatScheduleLines({
        schedule_type: 'one_shot',
        timezone: zone,
        starts_at: '2026-10-11T04:00:00Z',
        ends_at: null,
      } as never),
      ['Sun, Oct 11 · 12 AM'],
    );
  } finally {
    Intl.DateTimeFormat = previous;
  }
}

check(
  'about prefers description and drops a repeated summary',
  formatAboutBody({
    title: 'Trivia Night',
    summary: 'Join us on Saturday for trivia night hosted by David Bogaert.',
    description:
      'Join us on Saturday for trivia night hosted by David Bogaert.\n\nJoin us on Saturday for trivia night hosted by David Bogaert.',
  }),
  'Join us on Saturday for trivia night hosted by David Bogaert.',
);

check(
  'about strips a leading title',
  formatAboutBody({
    title: 'Jimmy Carr: Laughs Funny',
    summary: 'Jimmy Carr: Laughs Funny If you are a fan, this is the tour.',
    description:
      'Jimmy Carr: Laughs Funny If you are a fan, this is the tour. You are responsible for your own ticket.',
  }),
  'If you are a fan, this is the tour. You are responsible for your own ticket.',
);

check(
  'about strips a shouted title and a repeated paragraph',
  formatAboutBody({
    title: 'DRIVEN TO MOVE',
    description:
      'DRIVEN TO MOVE Driven to Move, powered by BFitness.\n\nDriven to Move, powered by BFitness.',
  }),
  'Driven to Move, powered by BFitness.',
);

check(
  'canada life place keeps the venue and one address',
  formatPlaceLines({
    venue: { name: 'Canada Life Place', city: 'London' },
    raw_venue_address: '99 Dundas Street · London, ON, London',
  }),
  {
    name: 'Canada Life Place',
    address: '99 Dundas Street, London, ON',
  },
);

check(
  'repeated city province and country collapse',
  cleanAddressLine(
    '728 Notre Dame Dr, London, ON N6J 3B6, Canada, London, ON, CA, London',
  ),
  '728 Notre Dame Dr, London, ON N6J 3B6',
);

check(
  'street-like venue name does not stack a second address',
  formatPlaceLines({
    raw_venue_name:
      '725 Notre Dame Dr, Unit 1, London, ON, Canada, Ontario N6J 3V5',
    raw_venue_address:
      '728 Notre Dame Dr, London, ON N6J 3B6, Canada, London, ON, CA, London',
  }),
  {
    name: null,
    address: '728 Notre Dame Dr, London, ON N6J 3B6',
  },
);

check(
  'backend venue name and address win',
  formatPlaceLines({
    venue_name: 'Canada Life Place',
    address_line: '99 Dundas Street, London, ON',
    raw_venue_name: '99 Dundas Street · London, ON, London',
    raw_venue_address: '99 Dundas Street · London, ON, London',
  }),
  {
    name: 'Canada Life Place',
    address: '99 Dundas Street, London, ON',
  },
);

check(
  'free notes do not duplicate the chip',
  formatDetailPrice({ is_free: true, price_notes: 'free' }),
  'Free',
);

check(
  'a positive price hides Free',
  formatDetailPrice({ is_free: true, price_min_cad: 25, price_notes: 'free' }),
  '$25',
);

check(
  'a single ticket price',
  formatDetailPrice({ is_free: false, price_min_cad: '81.73' }),
  '$81.73',
);

check(
  'a price range is from the low amount',
  formatDetailPrice({ price_min_cad: 81.73, price_max_cad: 120 }),
  'From $81.73',
);

check(
  'missing price is not invented as Free',
  formatDetailPrice({ is_free: false, price_notes: 'free' }),
  null,
);

check('schema SportsEvent is hidden', isSchemaOrgType('SportsEvent'), true);
check('schema Event is hidden', isSchemaOrgType('Event'), true);
check('a normal tag stays', isSchemaOrgType('Family friendly'), false);
check('Community stays', isSchemaOrgType('Community'), false);

check(
  'ticket button carries the price',
  formatActionLabel('Get tickets', '$81.73'),
  'Get tickets · $81.73',
);

check(
  'free ticket button stays short',
  formatActionLabel('Get tickets', 'Free'),
  'Get tickets',
);

console.log('all event presentation checks passed');
