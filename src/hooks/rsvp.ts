import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelRegistration,
  checkInGuest,
  fetchGuestList,
  fetchMyTickets,
  registerForEvent,
  updateRsvpSettings,
  type RsvpSettings,
} from '../api/rsvp';
import { useAuth } from '../auth';
import type { EventListItem } from '../types/events';
import { eventKeys } from './events';
import { useToggleFavourite } from './favourites';

export const rsvpKeys = {
  all: ['rsvp'] as const,
  tickets: (userId: string | null) => [...rsvpKeys.all, 'tickets', userId] as const,
  guests: (eventId: string) => [...rsvpKeys.all, 'guests', eventId] as const,
};

export function useMyTickets(enabled = true) {
  const { user, isSignedIn } = useAuth();
  const userId = user?.user_id ?? null;
  return useQuery({
    queryKey: rsvpKeys.tickets(userId),
    enabled: enabled && isSignedIn && Boolean(userId),
    queryFn: ({ signal }) => fetchMyTickets(signal),
  });
}

export function useMyTicket(eventId: string | undefined) {
  const query = useMyTickets(Boolean(eventId));
  return { ...query, ticket: query.data?.find((t) => t.event_id === eventId) ?? null };
}

/** Register, then save the event (Saved calendar + reminders, like a heart). */
export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  const favourite = useToggleFavourite();
  return useMutation({
    mutationFn: async ({ eventId }: { eventId: string; item?: EventListItem | null }) =>
      registerForEvent(eventId),
    onSuccess: (_reg, { eventId, item }) => {
      favourite.mutate({ eventId, next: true, item: item ?? undefined });
    },
    onSettled: (_d, _e, { eventId }) => {
      void queryClient.invalidateQueries({ queryKey: rsvpKeys.all });
      void queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => cancelRegistration(eventId),
    onSettled: (_d, _e, eventId) => {
      void queryClient.invalidateQueries({ queryKey: rsvpKeys.all });
      void queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

export function useGuestList(eventId: string | undefined) {
  return useQuery({
    queryKey: rsvpKeys.guests(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: ({ signal }) => fetchGuestList(eventId!, signal),
  });
}

export function useCheckIn(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => checkInGuest(eventId, code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rsvpKeys.guests(eventId) });
    },
  });
}

export function useUpdateRsvpSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, settings }: { eventId: string; settings: RsvpSettings }) =>
      updateRsvpSettings(eventId, settings),
    onSettled: (_d, _e, { eventId }) => {
      void queryClient.invalidateQueries({ queryKey: ['submissions'] });
      void queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}
