import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from './AuthProvider';

/**
 * Browsing never needs an account. Saving, adding to calendar, sharing,
 * posting/suggesting and RSVPs do: the sign-up sheet opens (with the
 * Terms / Privacy / Disclaimer boxes) and the action runs once the user
 * has an account and has accepted the current documents.
 */
export type AccountReason = 'save' | 'calendar' | 'share' | 'post' | 'rsvp';

type Pending = { run: () => void | Promise<void>; at: number } | null;
// A sign-up the user walked away from should not fire a stale action later.
const PENDING_TTL_MS = 15 * 60 * 1000;
let pending: Pending = null;

/** Called by the root navigator once the user is signed in and has accepted. */
export function takePendingAction(): Pending {
  const next = pending;
  pending = null;
  if (!next || Date.now() - next.at > PENDING_TTL_MS) return null;
  return next;
}

export function clearPendingAction(): void {
  pending = null;
}

export function useRequireAccount() {
  const router = useRouter();
  const { isSignedIn, needsLegal } = useAuth();
  return useCallback(
    (reason: AccountReason, action?: () => void | Promise<void>): boolean => {
      if (isSignedIn && !needsLegal) return true;
      pending = action ? { run: action, at: Date.now() } : null;
      if (!isSignedIn) router.push({ pathname: '/sign-up', params: { reason } });
      // Signed in but not accepted: the root navigator already shows accept-terms.
      return false;
    },
    [isSignedIn, needsLegal, router],
  );
}
