/**
 * Where the app sends API requests.
 * Development may use a LAN host. A release build may only use a public https URL.
 */

export type ApiBaseInput = {
  envUrl?: string | null;
  dev: boolean;
  hostUri?: string | null;
  platform?: string;
};

export type ApiBaseResolution = {
  url: string;
  /** Release build with no public https API URL. */
  misconfigured: boolean;
};

const PRIVATE_HOST =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/i;

export function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host.endsWith('.local')) return true;
  return PRIVATE_HOST.test(host);
}

function isPublicHttpsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !isPrivateOrLocalHost(url.hostname);
  } catch {
    return false;
  }
}

export function resolveApiBaseUrl(input: ApiBaseInput): ApiBaseResolution {
  const fromEnv = input.envUrl?.trim().replace(/\/$/, '') ?? '';
  if (fromEnv) {
    if (!input.dev && !isPublicHttpsUrl(fromEnv)) {
      return { url: '', misconfigured: true };
    }
    return { url: fromEnv, misconfigured: false };
  }

  if (!input.dev) return { url: '', misconfigured: true };

  const host = input.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return { url: `http://${host}:8000`, misconfigured: false };
  }
  if (input.platform === 'android') {
    return { url: 'http://10.0.2.2:8000', misconfigured: false };
  }
  return { url: 'http://localhost:8000', misconfigured: false };
}
