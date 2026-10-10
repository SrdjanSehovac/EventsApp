/**
 * Outbound links stay on the organizer or a ticketing page.
 * Competing discovery platforms are never shown or opened.
 *
 * Built-in block: allevents.in and every subdomain.
 * Add more hosts in BLOCKED_EVENT_HOSTS, or at runtime with
 * EXPO_PUBLIC_BLOCKED_EVENT_HOSTS (comma-separated hosts).
 *
 * The public button uses `external_url` + `link_type` only.
 * `source_url` and `ticket_url` are never a fallback.
 */

export type OutboundLinkType = 'tickets' | 'register' | 'website';

export type OutboundLink = {
  url: string;
  linkType: OutboundLinkType;
  label: string;
};

type BlockedPlatform = {
  host: string;
  /** Names used in “via …” attribution and source chips. */
  names: string[];
};

/** Edit this list to block another discovery platform. */
export const BLOCKED_EVENT_HOSTS: readonly BlockedPlatform[] = [
  {
    host: 'allevents.in',
    names: ['AllEvents', 'All Events', 'allevents', 'allevents.in'],
  },
];

const URL_IN_TEXT = /https?:\/\/[^\s<>"'[\]]+/gi;
const MARKDOWN_LINK = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi;
const HTML_LINK = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
const IMAGE_PATH = /\.(?:jpe?g|png|gif|webp|avif|heic|bmp|svg)(?:$|[?#])/i;
const TRAILING_URL_JUNK = /[),.;:!?]+$/;

function envBlockedHosts(): string[] {
  const raw = process.env.EXPO_PUBLIC_BLOCKED_EVENT_HOSTS ?? '';
  return raw
    .split(',')
    .map((entry: string) => entry.trim())
    .filter(Boolean);
}

function normalizeHost(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '')
    .replace(/^www\./, '');
}

function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function blockedPlatforms(
  extraHosts: readonly string[] = envBlockedHosts(),
): BlockedPlatform[] {
  const platforms = BLOCKED_EVENT_HOSTS.map((platform) => ({
    host: normalizeHost(platform.host),
    names: [...platform.names],
  }));
  for (const extra of extraHosts) {
    const host = normalizeHost(extra);
    if (!host || platforms.some((platform) => platform.host === host)) continue;
    const stem = host.split('.')[0] ?? host;
    platforms.push({ host, names: [host, stem] });
  }
  return platforms;
}

export function hostFromUrl(value: string): string | null {
  const trimmed = value.trim().replace(TRAILING_URL_JUNK, '');
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return normalizeHost(new URL(withScheme).hostname);
  } catch {
    return null;
  }
}

export function isBlockedHost(
  host: string,
  extraHosts?: readonly string[],
): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  return blockedPlatforms(extraHosts).some(
    (platform) =>
      normalized === platform.host ||
      normalized.endsWith(`.${platform.host}`),
  );
}

export function isBlockedUrl(
  url?: string | null,
  extraHosts?: readonly string[],
): boolean {
  if (!url?.trim()) return false;
  const host = hostFromUrl(url);
  return host != null && isBlockedHost(host, extraHosts);
}

/** http(s) URL that is not on the blocklist. Null hides the control. */
export function allowedOutboundUrl(
  url?: string | null,
  extraHosts?: readonly string[],
): string | null {
  const next = url?.trim() ?? '';
  if (!/^https?:\/\//i.test(next)) return null;
  if (isBlockedUrl(next, extraHosts)) return null;
  return next;
}

/**
 * Image bytes may load from a blocked CDN. A blocked host that is not an
 * image file is a page link and is dropped so it cannot be opened.
 */
export function allowedImageUrl(url?: string | null): string | null {
  const next = url?.trim() ?? '';
  if (!/^https?:\/\//i.test(next)) return null;
  if (!isBlockedUrl(next)) return next;
  const path = hostPath(next);
  return path && IMAGE_PATH.test(path) ? next : null;
}

function hostPath(url: string): string | null {
  try {
    return new URL(url).pathname + new URL(url).search;
  } catch {
    return null;
  }
}

export function normalizeLinkType(value?: string | null): OutboundLinkType {
  switch (value?.trim().toLowerCase()) {
    case 'tickets':
    case 'ticket':
      return 'tickets';
    case 'register':
    case 'registration':
    case 'rsvp':
      return 'register';
    default:
      return 'website';
  }
}

export function outboundLinkLabel(linkType?: string | null): string {
  switch (normalizeLinkType(linkType)) {
    case 'tickets':
      return 'Get tickets';
    case 'register':
      return 'Register';
    default:
      return 'Visit website';
  }
}

/**
 * The only public outbound action. Ignores source_url and ticket_url.
 * Returns null when external_url is missing or blocked.
 */
export function resolveOutboundLink(
  event: {
    external_url?: string | null;
    link_type?: string | null;
  },
  extraHosts?: readonly string[],
): OutboundLink | null {
  const url = allowedOutboundUrl(event.external_url, extraHosts);
  if (!url) return null;
  const linkType = normalizeLinkType(event.link_type);
  return { url, linkType, label: outboundLinkLabel(linkType) };
}

function platformNeedles(extraHosts?: readonly string[]): string[] {
  const needles = new Set<string>();
  for (const platform of blockedPlatforms(extraHosts)) {
    needles.add(platform.host);
    for (const name of platform.names) {
      if (name.trim()) needles.add(name.trim());
    }
  }
  return [...needles].sort((a, b) => b.length - a.length);
}

function attributionSource(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when a chip or source label is only a blocked platform. */
export function isBlockedSourceLabel(
  label?: string | null,
  extraHosts?: readonly string[],
): boolean {
  if (!label?.trim()) return false;
  const stripped = sanitizePublicText(label, extraHosts);
  if (!stripped) return true;
  const key = compact(stripped);
  return blockedPlatforms(extraHosts).some((platform) => {
    if (key === compact(platform.host)) return true;
    return platform.names.some((name) => key === compact(name));
  });
}

function stripBlockedMarkup(text: string, extraHosts?: readonly string[]): string {
  const withoutHtml = text.replace(HTML_LINK, (match, href: string, inner: string) => {
    if (!isBlockedUrl(href, extraHosts)) return match;
    const label = inner.replace(/<[^>]+>/g, '').trim();
    return isBlockedSourceLabel(label, extraHosts) ? '' : label;
  });
  return withoutHtml.replace(MARKDOWN_LINK, (match, label: string, href: string) => {
    if (!isBlockedUrl(href, extraHosts)) return match;
    const trimmed = label.trim();
    return isBlockedSourceLabel(trimmed, extraHosts) ? '' : trimmed;
  });
}

function stripBlockedUrls(text: string, extraHosts?: readonly string[]): string {
  return text.replace(URL_IN_TEXT, (url) =>
    isBlockedUrl(url, extraHosts) ? '' : url,
  );
}

function stripAttribution(text: string, extraHosts?: readonly string[]): string {
  let next = text;
  for (const name of platformNeedles(extraHosts)) {
    const source = attributionSource(name);
    next = next.replace(
      new RegExp(
        `(?:\\s*[-–—|·•,]\\s*)?\\b(?:via|from|source|powered by|listed on|found on|posted on|more on|see(?:\\s+more)?\\s+on|view on)\\s*:?\\s*${source}\\b[:.]?`,
        'gi',
      ),
      '',
    );
    next = next.replace(
      new RegExp(`\\s*[-–—|·•]\\s*${source}\\b[:.]?\\s*$`, 'gi'),
      '',
    );
  }
  return next;
}

/** Drop blocked URLs and “via AllEvents” style attribution from copy. */
export function sanitizePublicText(
  value?: string | null,
  extraHosts?: readonly string[],
): string | null {
  if (!value?.trim()) return null;
  let text = stripBlockedMarkup(value, extraHosts);
  text = stripBlockedUrls(text, extraHosts);
  text = stripAttribution(text, extraHosts);
  text = text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s|·•\-–—,;:]+|[\s|·•\-–—,;:]+$/g, '')
    .trim();
  return text || null;
}

export function visibleLabels(
  labels: string[],
  extraHosts?: readonly string[],
): string[] {
  const seen: string[] = [];
  for (const label of labels) {
    if (isBlockedSourceLabel(label, extraHosts)) continue;
    const next = sanitizePublicText(label, extraHosts);
    if (!next || seen.includes(next)) continue;
    seen.push(next);
  }
  return seen;
}
