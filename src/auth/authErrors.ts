/**
 * User-facing auth copy. Route names, status codes, and server bodies
 * stay in the console.
 */

const SIGN_UP_UNAVAILABLE =
  "Sign-up isn't available right now. Please try again later.";
const SIGN_IN_UNAVAILABLE =
  "Sign-in isn't available right now. Please try again later.";

const DEVELOPER_TEXT =
  /EventServer|\bPOST\b|\/v1\/|Request failed\s*\(|\bNot Found\b|Traceback|Exception/i;

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

export function friendlyAuthError(
  error: unknown,
  kind: 'sign-up' | 'sign-in',
): string {
  console.error(kind, error);
  const unavailable = kind === 'sign-up' ? SIGN_UP_UNAVAILABLE : SIGN_IN_UNAVAILABLE;
  const status = statusOf(error);
  const message = messageOf(error);
  if (
    status === 404 ||
    status === 501 ||
    status === 502 ||
    status === 503 ||
    !message ||
    DEVELOPER_TEXT.test(message)
  ) {
    return unavailable;
  }
  return message;
}
