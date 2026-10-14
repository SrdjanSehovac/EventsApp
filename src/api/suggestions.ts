import { apiRequest } from './client';

/**
 *   POST /me/suggestions   { title, description?, city, venue_name?, address?, starts_at?, link_url? }
 *   GET  /me/suggestions   → { items }
 *   POST /events/{id}/report { reason, details? }
 * Suggestions are private until an admin approves and promotes them into an event.
 */

export type SuggestEventInput = {
  title: string;
  description?: string | null;
  city: string;
  venue_name?: string | null;
  address?: string | null;
  starts_at?: string | null;
  link_url?: string | null;
};

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'promoted';

export type EventSuggestion = SuggestEventInput & {
  suggestion_id: string;
  status: SuggestionStatus;
  admin_notes?: string | null;
  promoted_event_id?: string | null;
  created_at: string;
};

export async function suggestEvent(input: SuggestEventInput): Promise<EventSuggestion> {
  return apiRequest<EventSuggestion>({ path: '/me/suggestions', method: 'POST', body: input });
}

export async function fetchMySuggestions(signal?: AbortSignal): Promise<EventSuggestion[]> {
  const raw = await apiRequest<{ items?: EventSuggestion[] }>({ path: '/me/suggestions', signal });
  return raw?.items ?? [];
}

export const REPORT_REASONS = [
  ['fake', 'Fake or scam'],
  ['wrong_info', 'Wrong date, place or details'],
  ['cancelled', 'Cancelled'],
  ['duplicate', 'Duplicate'],
  ['spam', 'Spam or ad'],
  ['offensive', 'Offensive'],
  ['other', 'Something else'],
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number][0];

export async function reportEvent(
  eventId: string,
  reason: ReportReason,
  details?: string | null,
): Promise<void> {
  await apiRequest<void>({
    path: `/events/${encodeURIComponent(eventId)}/report`,
    method: 'POST',
    body: { reason, details: details?.trim() || null },
  });
}

export function suggestionStatusLabel(status: SuggestionStatus): string {
  switch (status) {
    case 'approved':
      return 'Approved · being added';
    case 'promoted':
      return 'Added to the app';
    case 'rejected':
      return 'Not added';
    default:
      return 'In review';
  }
}
