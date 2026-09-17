import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../api/client';
import { fetchMySubmissions, submitEvent } from '../api/submissions';
import { useAuth } from '../auth';
import {
  appendLocalSubmission,
  getLocalSubmissions,
} from '../submissions/storage';
import type { SubmitEventInput, SubmittedEvent } from '../types/submissions';

export const submissionKeys = {
  all: ['submissions'] as const,
  mine: (userId: string | null) => [...submissionKeys.all, 'mine', userId] as const,
};

function mergeSubmissions(server: SubmittedEvent[], local: SubmittedEvent[]) {
  const seen = new Set(server.map((item) => item.submission_id));
  return [...server, ...local.filter((item) => !seen.has(item.submission_id))];
}

export function useMySubmissions(enabled = true) {
  const { user, isSignedIn } = useAuth();
  const userId = user?.user_id ?? null;

  return useQuery({
    queryKey: submissionKeys.mine(userId),
    enabled: enabled && isSignedIn && Boolean(userId),
    queryFn: async ({ signal }) => {
      const local = userId ? await getLocalSubmissions(userId) : [];
      try {
        const server = await fetchMySubmissions(signal);
        return mergeSubmissions(server, local);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 404 || error.status === 501)) {
          return local;
        }
        if (local.length > 0) return local;
        throw error;
      }
    },
  });
}

export function useSubmitEvent() {
  const queryClient = useQueryClient();
  const { user, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (input: SubmitEventInput) => {
      if (!isSignedIn || !user) {
        throw new Error('Sign in to submit an event.');
      }

      try {
        const created = await submitEvent(input);
        await appendLocalSubmission(user.user_id, created);
        return created;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 404 || error.status === 501)) {
          const local: SubmittedEvent = {
            ...input,
            submission_id: `local-${Date.now()}`,
            status: 'local',
            created_at: new Date().toISOString(),
            source: 'local',
          };
          await appendLocalSubmission(user.user_id, local);
          return local;
        }
        throw error;
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}
