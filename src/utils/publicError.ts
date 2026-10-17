/**
 * Copy that can be shown on screen. Route names, stack traces, and
 * transport failures stay out of the UI.
 */

const DEVELOPER_TEXT =
  /EventServer|\b(?:GET|POST|PUT|PATCH|DELETE)\b|\/v1\/|Request failed\s*\(|\bNot Found\b|Traceback|Exception|failed to fetch|network request failed|load failed|localhost|10\.0\.2\.2/i;

function statusOf(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('status' in error)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message.trim();
  if (typeof error === 'string') return error.trim();
  return '';
}

/** A sentence the user can act on. Human server messages are kept. */
export function friendlyPublicError(error: unknown, fallback: string): string {
  const status = statusOf(error);
  const message = messageOf(error);
  if (
    status === 0 ||
    status === 404 ||
    status === 501 ||
    status === 502 ||
    status === 503 ||
    !message ||
    DEVELOPER_TEXT.test(message)
  ) {
    return fallback;
  }
  return message;
}
