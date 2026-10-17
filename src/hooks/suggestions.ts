import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchMySuggestions,
  reportEvent,
  suggestEvent,
  type ReportReason,
  type SuggestEventInput,
} from '../api/suggestions';
import { useAuth } from '../auth';

export const suggestionKeys = {
  all: ['suggestions'] as const,
  mine: (userId: string | null) => [...suggestionKeys.all, 'mine', userId] as const,
};

export function useMySuggestions(enabled = true) {
  const { user, isSignedIn } = useAuth();
  const userId = user?.user_id ?? null;
  return useQuery({
    queryKey: suggestionKeys.mine(userId),
    enabled: enabled && isSignedIn && Boolean(userId),
    queryFn: ({ signal }) => fetchMySuggestions(signal),
  });
}

export function useSuggestEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SuggestEventInput) => suggestEvent(input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: suggestionKeys.all });
    },
  });
}

export function useReportEvent() {
  return useMutation({
    mutationFn: (input: { eventId: string; reason: ReportReason; details?: string | null }) =>
      reportEvent(input.eventId, input.reason, input.details),
  });
}
