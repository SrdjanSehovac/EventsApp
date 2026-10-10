import {
  allowedImageUrl,
  allowedOutboundUrl,
  isBlockedSourceLabel,
  isBlockedUrl,
  resolveOutboundLink,
  sanitizePublicText,
} from './outboundLinks';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

check('allevents.in is blocked', isBlockedUrl('https://allevents.in/london/e/1'), true);
check(
  'www.allevents.in is blocked',
  isBlockedUrl('https://www.allevents.in/e/1'),
  true,
);
check(
  'a subdomain is blocked',
  isBlockedUrl('https://m.allevents.in/london'),
  true,
);
check(
  'lookalike host is allowed',
  isBlockedUrl('https://notallevents.in/e/1'),
  false,
);
check(
  'suffix lookalike is allowed',
  isBlockedUrl('https://allevents.in.example.com/e/1'),
  false,
);
check(
  'organizer site is allowed',
  allowedOutboundUrl('https://tickets.example.com/london'),
  'https://tickets.example.com/london',
);
check('empty url is hidden', allowedOutboundUrl(null), null);
check('blocked url is hidden', allowedOutboundUrl('https://allevents.in/e/1'), null);
check(
  'extra host is configurable',
  isBlockedUrl('https://rival.example/e/1', ['rival.example']),
  true,
);

check(
  'tickets label',
  resolveOutboundLink({
    external_url: 'https://tickets.example.com/1',
    link_type: 'tickets',
    source_url: 'https://allevents.in/e/1',
  } as { external_url: string; link_type: string }),
  {
    url: 'https://tickets.example.com/1',
    linkType: 'tickets',
    label: 'Get tickets',
  },
);
check(
  'register label',
  resolveOutboundLink({
    external_url: 'https://club.example/rsvp',
    link_type: 'register',
  })?.label,
  'Register',
);
check(
  'website label',
  resolveOutboundLink({
    external_url: 'https://venue.example',
    link_type: 'website',
  })?.label,
  'Visit website',
);
check(
  'missing external_url does not fall back to source_url',
  resolveOutboundLink({ external_url: null }),
  null,
);
check(
  'blocked external_url is hidden',
  resolveOutboundLink({
    external_url: 'https://www.allevents.in/london/x',
    link_type: 'tickets',
  }),
  null,
);

check(
  'via AllEvents is stripped',
  sanitizePublicText('Night market via AllEvents'),
  'Night market',
);
check(
  'via AllEvents.in is stripped',
  sanitizePublicText('Night market via AllEvents.in.'),
  'Night market',
);
check(
  'source attribution is stripped',
  sanitizePublicText('Source: AllEvents'),
  null,
);
check(
  'trailing separator after attribution is removed',
  sanitizePublicText('Free · via AllEvents'),
  'Free',
);
check(
  'blocked url is stripped from the description',
  sanitizePublicText('Doors at 7. https://allevents.in/london/e/9'),
  'Doors at 7.',
);
check(
  'markdown link to a blocked host drops the url',
  sanitizePublicText('Buy here [AllEvents](https://allevents.in/e/1) tonight'),
  'Buy here tonight',
);
check(
  'allowed description link stays',
  sanitizePublicText('Tickets: https://venue.example/tix'),
  'Tickets: https://venue.example/tix',
);
check('AllEvents chip is hidden', isBlockedSourceLabel('AllEvents'), true);
check('via AllEvents chip is hidden', isBlockedSourceLabel('via AllEvents'), true);
check('Music chip stays', isBlockedSourceLabel('Music'), false);

check(
  'image file on a blocked CDN still loads',
  allowedImageUrl('https://cdn.allevents.in/photos/a.jpg'),
  'https://cdn.allevents.in/photos/a.jpg',
);
check(
  'blocked page is not an image link',
  allowedImageUrl('https://allevents.in/london/event/1'),
  null,
);
check(
  'organizer image stays',
  allowedImageUrl('https://venue.example/hero.jpg'),
  'https://venue.example/hero.jpg',
);

console.log('all outbound link checks passed');
