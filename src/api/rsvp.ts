import { apiRequest } from './client';

/**
 *   POST   /events/{id}/register        → Registration (confirmed | waitlisted)
 *   DELETE /events/{id}/register        → 204
 *   GET    /me/tickets                  → { items: Ticket[] }
 *   GET    /me/events/{id}/guests       → GuestList (organizer only)
 *   POST   /me/events/{id}/check-in     { ticket_code } → { result, guest }
 *   PUT    /me/events/{id}/rsvp         { rsvp_enabled, rsvp_capacity, rsvp_closes_at, rsvp_waitlist }
 */

export * from '../utils/rsvpFormat';
import type { CheckInResult, GuestList, Registration, RsvpSettings, Ticket } from '../utils/rsvpFormat';
import { normalizeTicketCode } from '../utils/rsvpFormat';

export const registerForEvent = (eventId: string) =>
  apiRequest<Registration>({ path: `/events/${encodeURIComponent(eventId)}/register`, method: 'POST' });

export const cancelRegistration = (eventId: string) =>
  apiRequest<void>({ path: `/events/${encodeURIComponent(eventId)}/register`, method: 'DELETE' });

export async function fetchMyTickets(signal?: AbortSignal): Promise<Ticket[]> {
  const raw = await apiRequest<{ items?: Ticket[] }>({ path: '/me/tickets', signal });
  return raw?.items ?? [];
}

export const fetchGuestList = (eventId: string, signal?: AbortSignal) =>
  apiRequest<GuestList>({ path: `/me/events/${encodeURIComponent(eventId)}/guests`, signal });

export const checkInGuest = (eventId: string, code: string) =>
  apiRequest<CheckInResult>({
    path: `/me/events/${encodeURIComponent(eventId)}/check-in`,
    method: 'POST',
    body: { ticket_code: normalizeTicketCode(code) },
  });

export const updateRsvpSettings = (eventId: string, settings: RsvpSettings) =>
  apiRequest<unknown>({ path: `/me/events/${encodeURIComponent(eventId)}/rsvp`, method: 'PUT', body: settings });

