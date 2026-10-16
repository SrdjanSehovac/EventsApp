/** Pure RSVP types and helpers (no React Native imports, so tests can run in node). */

export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export type Registration = {
  registration_id: string;
  event_id: string;
  status: RegistrationStatus;
  ticket_code: string;
  waitlist_position?: number | null;
  checked_in_at?: string | null;
  created_at: string;
  email_sent?: boolean;
};

export type Ticket = Registration & {
  title: string;
  starts_at?: string | null;
  ends_at?: string | null;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  image_url?: string | null;
  organizer_name?: string | null;
  event_status?: string;
};

export type Guest = {
  registration_id: string;
  name?: string | null;
  email: string;
  status: RegistrationStatus;
  ticket_code: string;
  checked_in_at?: string | null;
  created_at: string;
};

export type GuestList = {
  event_id: string;
  title: string;
  capacity?: number | null;
  confirmed: number;
  waitlisted: number;
  checked_in: number;
  items: Guest[];
};

export type CheckInResult = { result: 'checked_in' | 'already_checked_in'; guest: Guest };

export type RsvpSettings = {
  rsvp_enabled: boolean;
  rsvp_capacity?: number | null;
  rsvp_closes_at?: string | null;
  rsvp_waitlist?: boolean;
};

/** "X9YYT7TW" → "X9YY-T7TW" */
export function formatTicketCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

/** What the QR encodes; check-in accepts this or the typed code. */
export function ticketQrValue(code: string): string {
  return `EVT:${code}`;
}

export function normalizeTicketCode(raw: string): string {
  let text = raw.trim().toUpperCase();
  if (text.startsWith('EVT:')) text = text.slice(4);
  return text.replace(/[^A-Z0-9]/g, '');
}

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function guestListCsv(list: GuestList): string {
  const rows = [['name', 'email', 'status', 'ticket_code', 'registered_at', 'checked_in_at']];
  for (const g of list.items) {
    rows.push([
      g.name ?? '',
      g.email,
      g.status,
      formatTicketCode(g.ticket_code),
      g.created_at,
      g.checked_in_at ?? '',
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

/** Button/status copy for an RSVP event. */
export function rsvpState(
  rsvp: { full: boolean; closed: boolean; waitlist: boolean; spots_left?: number | null } | null | undefined,
  mine?: RegistrationStatus | null,
): { label: string; note: string | null; action: 'register' | 'waitlist' | 'ticket' | 'none' } {
  if (mine === 'confirmed') return { label: 'View your ticket', note: 'You’re registered', action: 'ticket' };
  if (mine === 'waitlisted') return { label: 'View waitlist spot', note: 'You’re on the waitlist', action: 'ticket' };
  if (!rsvp) return { label: 'Register — Free', note: null, action: 'register' };
  if (rsvp.closed) return { label: 'Registration closed', note: null, action: 'none' };
  if (rsvp.full) {
    return rsvp.waitlist
      ? { label: 'Join waitlist — Free', note: 'Full', action: 'waitlist' }
      : { label: 'Full', note: 'No spots left', action: 'none' };
  }
  const left = rsvp.spots_left;
  const note = left == null ? null : left <= 20 ? `${left} spot${left === 1 ? '' : 's'} left` : null;
  return { label: 'Register — Free', note, action: 'register' };
}
