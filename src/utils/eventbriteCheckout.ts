/**
 * Eventbrite embedded checkout, without React Native.
 *
 * Official widget (`eb_widgets.js` 3.x) calls
 * `EBWidgets.createWidget({ widgetType: 'checkout', eventId, modal, iframeContainerId, onOrderComplete })`.
 * It builds `https://<eventbrite-host>/checkout-external?eid=<id>&parent=<window.location.href>`.
 * The script logs "the embedded checkout widget can only be used on pages served over https"
 * when `window.location.protocol` is not `https:`. Eventbrite also requires the embedding
 * page to present a real HTTPS certificate and a Referrer-Policy of `origin` or
 * `origin-when-cross-origin` (not `no-referrer`), or order submit fails.
 *
 * A WebView `html` document is not a certificate-backed origin. CloudFront returns
 * 403 for `checkout-external` when `parent` is an http URL (verified with
 * `parent=http://127.0.0.1/`). The same checkout returns 200 when `parent` is https,
 * including `https://www.eventbrite.com/checkout-external`, and when `parent` is omitted.
 * We still try the widget with that https `baseUrl`. If `window.location.protocol`
 * is not `https:` (WKWebView often keeps `about:blank` for an html string), or the
 * widget never creates an iframe, or Eventbrite bounces to `/e/<id>`, the sheet loads
 * `https://www.eventbrite.ca/checkout-external?eid=<id>` with no parent. That page
 * returns the ticket-selection checkout for a public event the app does not own.
 *
 * There is no organizer allow-list in the widget. Any public event can be embedded.
 * Events whose organizer turned embedded checkout off get `widgetNotEligible` and use
 * the direct checkout URL instead.
 *
 * Apple Pay on the Web inside WKWebView needs the app's Apple Pay merchant entitlement
 * and an associated domain for the top frame. Eventbrite's button will not complete
 * Apple Pay from this sheet. Card entry is the path that works. `paymentRequestEnabled`
 * is set anyway so the Payment Request API is not hard-disabled.
 *
 * `source_url` is only an id source. It is never an outbound link.
 */

import { allowedOutboundUrl, isBlockedHost } from './outboundLinks';

export const EVENTBRITE_WIDGET_SCRIPT =
  'https://www.eventbrite.com/static/widgets/eb_widgets.js';

/** Document URL passed as the WebView base so the widget sees an https origin. */
export const EVENTBRITE_WIDGET_BASE =
  'https://www.eventbrite.com/checkout-external';

const EVENT_ID = /^\d{6,20}$/;
const DEFAULT_BRAND = '#0F766E';

/** Country sites the official widget treats as Eventbrite. */
const EVENTBRITE_ROOTS = [
  'eventbrite.at',
  'eventbrite.be',
  'eventbrite.ca',
  'eventbrite.ch',
  'eventbrite.cl',
  'eventbrite.co',
  'eventbrite.co.nz',
  'eventbrite.co.uk',
  'eventbrite.com',
  'eventbrite.com.ar',
  'eventbrite.com.au',
  'eventbrite.com.br',
  'eventbrite.com.mx',
  'eventbrite.com.pe',
  'eventbrite.de',
  'eventbrite.dk',
  'eventbrite.es',
  'eventbrite.fi',
  'eventbrite.fr',
  'eventbrite.hk',
  'eventbrite.ie',
  'eventbrite.in',
  'eventbrite.it',
  'eventbrite.my',
  'eventbrite.nl',
  'eventbrite.no',
  'eventbrite.pt',
  'eventbrite.se',
  'eventbrite.sg',
] as const;

/** Image/script CDNs. Not event pages. */
const ASSET_ROOTS = ['evbuc.com', 'evbstatic.com'] as const;

const PAYMENT_ROOTS = [
  'stripe.com',
  'stripe.network',
  'paypal.com',
  'paypalobjects.com',
  'braintreegateway.com',
  'braintree-api.com',
  'recaptcha.net',
  'gstatic.com',
  'hcaptcha.com',
  'apple.com',
] as const;

const CHECKOUT_PREFIXES = [
  '/checkout',
  '/static/',
  '/order',
  '/api/',
  '/register',
  '/signin',
  '/login',
  '/signup',
  '/tickets',
  '/oauth',
  '/mytickets',
] as const;

export type EventbriteIdSource = {
  eventbrite_event_id?: string | null;
  checkout_url?: string | null;
  external_url?: string | null;
  source_url?: string | null;
};

export type CheckoutMessage =
  | { type: 'order-complete'; orderId?: string }
  | { type: 'widget-unavailable' };

export type TicketDestination =
  | { kind: 'eventbrite'; eventId: string }
  | { kind: 'browser'; url: string };

function hostOf(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, '');
}

function hostMatches(hostname: string, roots: readonly string[]): boolean {
  const host = hostOf(hostname);
  return roots.some((root) => host === root || host.endsWith(`.${root}`));
}

export function isEventbriteHost(hostname: string): boolean {
  return hostMatches(hostname, EVENTBRITE_ROOTS);
}

export function isEventbriteUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      isEventbriteHost(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function idFromUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (!isEventbriteHost(parsed.hostname)) return null;
  const eid = parsed.searchParams.get('eid')?.trim() ?? '';
  if (EVENT_ID.test(eid)) return eid;
  const tickets = parsed.pathname.match(/tickets-(\d{6,20})(?:\/|$)/i);
  if (tickets?.[1]) return tickets[1];
  const numeric = parsed.pathname.match(/\/e\/(\d{6,20})(?:\/|$)/);
  if (numeric?.[1]) return numeric[1];
  const trailing = parsed.pathname.match(/-(\d{8,20})\/?$/);
  return trailing?.[1] ?? null;
}

/**
 * Digits-only Eventbrite event id.
 * Explicit `eventbrite_event_id`, then checkout, external, and source URLs.
 */
export function eventbriteEventId(event: EventbriteIdSource): string | null {
  const explicit = event.eventbrite_event_id?.trim() ?? '';
  if (EVENT_ID.test(explicit)) return explicit;
  return (
    idFromUrl(event.checkout_url) ??
    idFromUrl(event.external_url) ??
    idFromUrl(event.source_url)
  );
}

export function eventbriteCheckoutUrl(eventId: string): string {
  if (!EVENT_ID.test(eventId)) return '';
  return `https://www.eventbrite.ca/checkout-external?eid=${eventId}`;
}

function brandColor(value?: string | null): string {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : DEFAULT_BRAND;
}

/** Minimal page that mounts the official checkout widget and reports back. */
export function eventbriteWidgetHtml(eventId: string, color?: string | null): string {
  if (!EVENT_ID.test(eventId)) return '';
  const brand = brandColor(color);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<meta name="referrer" content="origin-when-cross-origin" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #fff; }
  #eb-checkout { min-height: 100%; }
  a[target="_blank"], a[data-automation] { display: none !important; }
</style>
</head>
<body>
<div id="eb-checkout"></div>
<script src="${EVENTBRITE_WIDGET_SCRIPT}"></script>
<script>
  function post(message) {
    var payload = JSON.stringify(message);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(payload);
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }
  }
  document.addEventListener('click', function (event) {
    var node = event.target;
    while (node && node.tagName !== 'A') node = node.parentNode;
    if (node) event.preventDefault();
  }, true);
  function start() {
    if (window.location.protocol !== 'https:') {
      post({ type: 'widget-unavailable' });
      return;
    }
    if (!window.EBWidgets || typeof window.EBWidgets.createWidget !== 'function') {
      post({ type: 'widget-unavailable' });
      return;
    }
    try {
      window.EBWidgets.createWidget({
        widgetType: 'checkout',
        eventId: '${eventId}',
        modal: false,
        iframeContainerId: 'eb-checkout',
        iframeAutoAdapt: 100,
        themeSettings: { brandColor: '${brand}' },
        onOrderComplete: function (order) {
          post({ type: 'order-complete', orderId: order && order.orderId });
        }
      });
    } catch (error) {
      post({ type: 'widget-unavailable' });
      return;
    }
    setTimeout(function () {
      if (!document.querySelector('#eb-checkout iframe')) {
        post({ type: 'widget-unavailable' });
      }
    }, 4500);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
</script>
</body>
</html>`;
}

export function parseCheckoutMessage(data: string): CheckoutMessage | null {
  try {
    const parsed = JSON.parse(data) as { type?: string; orderId?: unknown };
    if (parsed.type === 'order-complete') {
      const orderId = typeof parsed.orderId === 'string' ? parsed.orderId : undefined;
      return { type: 'order-complete', orderId };
    }
    if (parsed.type === 'widget-unavailable') return { type: 'widget-unavailable' };
    return null;
  } catch {
    return null;
  }
}

function isCheckoutPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return CHECKOUT_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) return path.startsWith(prefix);
    return path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}-`);
  });
}

function isPaymentHost(hostname: string): boolean {
  if (hostMatches(hostname, PAYMENT_ROOTS)) return true;
  const host = hostOf(hostname);
  return (
    host === 'pay.google.com' ||
    host === 'payments.google.com' ||
    host === 'accounts.google.com' ||
    host === 'google.com'
  );
}

/**
 * True when the WebView may load this URL.
 * Eventbrite event pages, discovery, and promos are refused.
 * Returning false must not open the URL anywhere else.
 */
function isAssetHost(hostname: string): boolean {
  if (hostMatches(hostname, ASSET_ROOTS)) return true;
  if (!isEventbriteHost(hostname)) return false;
  const label = hostOf(hostname).split('.')[0] ?? '';
  return /cdn|static|img|media|asset|transcend/.test(label);
}

export function allowCheckoutNavigation(
  url: string,
  _options?: { isTopFrame?: boolean },
): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed === 'about:blank' || trimmed.startsWith('about:blank') || trimmed.startsWith('about:srcdoc')) {
    return true;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (isBlockedHost(parsed.hostname)) return false;
  // Consent and image CDNs sit on eventbrite.com subdomains. Event pages do not.
  if (isAssetHost(parsed.hostname) || isPaymentHost(parsed.hostname)) return true;
  if (isEventbriteHost(parsed.hostname)) return isCheckoutPath(parsed.pathname);
  // Issuer and 3-D Secure pages use hosts we cannot list, and they may
  // replace either frame. Stay on those pages. Eventbrite event pages
  // and promos were already refused above. `_options.isTopFrame` is
  // accepted from the WebView and does not open a second browser.
  return true;
}

export function isEventbriteEventPage(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (!isEventbriteHost(parsed.hostname)) return false;
    const path = parsed.pathname.toLowerCase();
    return (
      path === '/' ||
      path.startsWith('/e/') ||
      path.startsWith('/d/') ||
      path.startsWith('/b/') ||
      path.startsWith('/cc/')
    );
  } catch {
    return false;
  }
}

export function isOrderCompleteUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:' || !isEventbriteHost(parsed.hostname)) return false;
    if (parsed.searchParams.get('order_id') || parsed.searchParams.get('orderId')) {
      return true;
    }
    const path = parsed.pathname.toLowerCase();
    return (
      path.includes('order-confirmation') ||
      path.includes('orderconfirmation')
    );
  } catch {
    return false;
  }
}

/**
 * Eventbrite checkouts stay in the sheet. Every other allowed seller
 * opens in the in-app browser. Blocked hosts open nowhere.
 */
export function ticketDestination(
  event: EventbriteIdSource,
  url: string,
): TicketDestination | null {
  const allowed = allowedOutboundUrl(url);
  if (!allowed) return null;
  const eventId = eventbriteEventId(event);
  if (eventId && isEventbriteUrl(allowed)) {
    return { kind: 'eventbrite', eventId };
  }
  return { kind: 'browser', url: allowed };
}
