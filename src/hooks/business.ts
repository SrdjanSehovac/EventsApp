import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  applyAsBusiness,
  fetchMyBusiness,
  isMissingBusinessRoute,
  resendBusinessVerification,
  verifyBusinessEmail,
  type VerifyBusinessEmailInput,
} from '../api/business';
import { useAuth } from '../auth';
import { getLocalBusiness, setLocalBusiness } from '../business/storage';
import type { BusinessApplyInput, BusinessProfile } from '../types/business';

export const businessKeys = {
  all: ['business'] as const,
  mine: (userId: string | null) => [...businessKeys.all, 'mine', userId] as const,
};

function preferServer(
  server: BusinessProfile | null,
  local: BusinessProfile | null,
): BusinessProfile | null {
  if (server) return server;
  return local;
}

export function useMyBusiness(enabled = true) {
  const { user, isSignedIn } = useAuth();
  const userId = user?.user_id ?? null;

  return useQuery({
    queryKey: businessKeys.mine(userId),
    enabled: enabled && isSignedIn && Boolean(userId),
    queryFn: async ({ signal }) => {
      const local = userId ? await getLocalBusiness(userId) : null;
      try {
        const server = await fetchMyBusiness(signal);
        if (server && userId) {
          await setLocalBusiness(userId, { ...server, source: 'server' });
        }
        return preferServer(server, local);
      } catch (error) {
        if (isMissingBusinessRoute(error)) {
          return local;
        }
        if (local) return local;
        throw error;
      }
    },
  });
}

export function useApplyAsBusiness() {
  const queryClient = useQueryClient();
  const { user, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (input: BusinessApplyInput) => {
      if (!isSignedIn || !user) {
        throw new Error('Sign in to apply as a business.');
      }

      try {
        const created = await applyAsBusiness(input);
        await setLocalBusiness(user.user_id, created);
        return created;
      } catch (error) {
        if (isMissingBusinessRoute(error)) {
          const local: BusinessProfile = {
            ...input,
            application_id: `local-${Date.now()}`,
            status: 'pending_email',
            email_verified: false,
            bio: null,
            rejection_reason: null,
            created_at: new Date().toISOString(),
            updated_at: null,
            source: 'local',
          };
          await setLocalBusiness(user.user_id, local);
          return local;
        }
        throw error;
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });
}

export function useVerifyBusinessEmail() {
  const queryClient = useQueryClient();
  const { user, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (input: VerifyBusinessEmailInput) => {
      if (!isSignedIn || !user) {
        throw new Error('Sign in to verify your business email.');
      }

      try {
        const updated = await verifyBusinessEmail(input);
        await setLocalBusiness(user.user_id, updated);
        return updated;
      } catch (error) {
        if (isMissingBusinessRoute(error)) {
          const current = await getLocalBusiness(user.user_id);
          if (!current) {
            throw new Error('Apply as a business before verifying email.');
          }
          const next: BusinessProfile = {
            ...current,
            email_verified: true,
            status: current.status === 'pending_email' ? 'pending_review' : current.status,
            updated_at: new Date().toISOString(),
            source: 'local',
          };
          await setLocalBusiness(user.user_id, next);
          return next;
        }
        throw error;
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });
}

export function useResendBusinessVerification() {
  const { user, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!isSignedIn || !user) {
        throw new Error('Sign in to resend the verification email.');
      }
      const current = await getLocalBusiness(user.user_id);
      try {
        await resendBusinessVerification(current?.business_email);
      } catch (error) {
        if (isMissingBusinessRoute(error)) {
          return;
        }
        throw error;
      }
    },
  });
}

export function useIsVerifiedBusiness(enabled = true) {
  const query = useMyBusiness(enabled);
  return query.data?.status === 'verified';
}
