import {
  allowCheckoutNavigation,
  eventbriteCheckoutUrl,
  eventbriteEventId,
  eventbriteWidgetHtml,
  isEventbriteEventPage,
  isOrderCompleteUrl,
  parseCheckoutMessage,
  ticketDestination,
} from './eventbriteCheckout';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

const ticketsUrl =
  'https://www.eventbrite.ca/e/driven-to-move-tickets-198765432109';

check(
  'explicit eventbrite id wins',
  eventbriteEventId({
    eventbrite_event_id: '123456789',
    external_url: ticketsUrl,
  }),
  '123456789',
);

check(
  'tickets slug on eventbrite.ca',
  eventbriteEventId({ external_url: ticketsUrl }),
  '198765432109',
);

check(
  'eid query on checkout url',
  eventbriteEventId({
    checkout_url: 'https://www.eventbrite.com/checkout-external?eid=555666777',
    external_url: ticketsUrl,
  }),
  '555666777',
);

check(
  'numeric /e/ path',
  eventbriteEventId({
    external_url: 'https://www.eventbrite.co.uk/e/99887766',
  }),
  '99887766',
);

check(
  'source url is an id source only',
  eventbriteEventId({
    external_url: 'https://tickets.example.com/buy',
    source_url: 'https://www.eventbrite.com/e/night-out-tickets-445566778',
  }),
  '445566778',
);

check(
  'allevents lookalike is not an eventbrite id',
  eventbriteEventId({
    external_url: 'https://allevents.in/london/e/party-tickets-123456789',
    source_url: 'https://www.allevents.in/e/123456789012',
  }),
  null,
);

check(
  'short ids are ignored',
  eventbriteEventId({ eventbrite_event_id: '12345' }),
  null,
);

check(
  'checkout url is the canadian external checkout',
  eventbriteCheckoutUrl('198765432109'),
  'https://www.eventbrite.ca/checkout-external?eid=198765432109',
);

const html = eventbriteWidgetHtml('198765432109', '#0F766E');
check('widget html is empty for a bad id', eventbriteWidgetHtml('nope'), '');
check('widget uses the official script', html.includes('https://www.eventbrite.com/static/widgets/eb_widgets.js'), true);
check('widget requests checkout', html.includes("widgetType: 'checkout'"), true);
check('widget is inline', html.includes('modal: false'), true);
check('widget targets our container', html.includes("iframeContainerId: 'eb-checkout'"), true);
check('widget themes with brandColor', html.includes("themeSettings: { brandColor: '#0F766E' }"), true);
check('widget reports order complete', html.includes("type: 'order-complete'"), true);
check('widget reports when no iframe appears', html.includes("type: 'widget-unavailable'"), true);
check('widget sets a referrer policy', html.includes('origin-when-cross-origin'), true);
check(
  'widget skips itself unless the document is https',
  html.includes("window.location.protocol !== 'https:'"),
  true,
);
check('bad brand color falls back', eventbriteWidgetHtml('198765432109', 'red').includes("#0F766E"), true);

check(
  'checkout-external is allowed',
  allowCheckoutNavigation('https://www.eventbrite.ca/checkout-external?eid=198765432109'),
  true,
);
check(
  'widget script is allowed',
  allowCheckoutNavigation('https://www.eventbrite.com/static/widgets/eb_widgets.js'),
  true,
);
check(
  'event page is blocked',
  allowCheckoutNavigation('https://www.eventbrite.ca/e/driven-to-move-tickets-198765432109'),
  false,
);
check(
  'eventbrite home is blocked',
  allowCheckoutNavigation('https://www.eventbrite.com/'),
  false,
);
check(
  'discovery is blocked',
  allowCheckoutNavigation('https://www.eventbrite.com/d/canada--london/events/'),
  false,
);
check('stripe is allowed', allowCheckoutNavigation('https://js.stripe.com/v3'), true);
check(
  'eventbrite cdn is allowed',
  allowCheckoutNavigation('https://cdntranscend.eventbrite.com/cm/consent.js'),
  true,
);
check(
  'evbuc images are allowed',
  allowCheckoutNavigation('https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com/banner.jpg'),
  true,
);
check('about blank is allowed', allowCheckoutNavigation('about:blank'), true);
check('http is blocked', allowCheckoutNavigation('http://www.eventbrite.ca/checkout-external?eid=1'), false);
check(
  'allevents is blocked',
  allowCheckoutNavigation('https://allevents.in/london/event'),
  false,
);
check(
  'bank subframe is allowed',
  allowCheckoutNavigation('https://acs.bank.example/3ds', { isTopFrame: false }),
  true,
);
check(
  'bank top frame stays in the sheet',
  allowCheckoutNavigation('https://acs.bank.example/3ds', { isTopFrame: true }),
  true,
);

check(
  'event page detector',
  isEventbriteEventPage('https://www.eventbrite.com/e/driven-to-move-tickets-198765432109'),
  true,
);
check(
  'order id query completes',
  isOrderCompleteUrl('https://www.eventbrite.ca/checkout-external?eid=198765432109&order_id=99'),
  true,
);
check(
  'confirmation path completes',
  isOrderCompleteUrl('https://www.eventbrite.com/order-confirmation/99'),
  true,
);
check(
  'checkout itself is not complete',
  isOrderCompleteUrl('https://www.eventbrite.ca/checkout-external?eid=198765432109'),
  false,
);

check(
  'order complete message',
  parseCheckoutMessage('{"type":"order-complete","orderId":"42"}'),
  { type: 'order-complete', orderId: '42' },
);
check(
  'widget unavailable message',
  parseCheckoutMessage('{"type":"widget-unavailable"}'),
  { type: 'widget-unavailable' },
);

check(
  'eventbrite outbound opens the sheet',
  ticketDestination(
    { external_url: ticketsUrl, source_url: 'https://allevents.in/x' },
    ticketsUrl,
  ),
  { kind: 'eventbrite', eventId: '198765432109' },
);
check(
  'ticketmaster stays in the browser',
  ticketDestination(
    {
      external_url: 'https://www.ticketmaster.ca/event/1',
      source_url: ticketsUrl,
    },
    'https://www.ticketmaster.ca/event/1',
  ),
  { kind: 'browser', url: 'https://www.ticketmaster.ca/event/1' },
);
check(
  'blocked host opens nowhere',
  ticketDestination(
    { external_url: 'https://allevents.in/london/e/1' },
    'https://allevents.in/london/e/1',
  ),
  null,
);
check(
  'eventbrite without an id uses the in-app browser',
  ticketDestination(
    { external_url: 'https://www.eventbrite.com/e/private-listing' },
    'https://www.eventbrite.com/e/private-listing',
  ),
  { kind: 'browser', url: 'https://www.eventbrite.com/e/private-listing' },
);

console.log('all eventbrite checkout checks passed');
