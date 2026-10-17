import { formatTicketCode, guestListCsv, normalizeTicketCode, rsvpState } from './rsvpFormat';

function eq(a: unknown, b: unknown, msg: string) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

eq(formatTicketCode('X9YYT7TW'), 'X9YY-T7TW', 'format');
eq(normalizeTicketCode('evt:x9yy-t7tw'), 'X9YYT7TW', 'qr payload');
eq(normalizeTicketCode(' x9yy t7tw '), 'X9YYT7TW', 'typed');
eq(rsvpState({ full: false, closed: false, waitlist: false, spots_left: 3 }).note, '3 spots left', 'spots');
eq(rsvpState({ full: false, closed: false, waitlist: false, spots_left: 80 }).note, null, 'many spots');
eq(rsvpState({ full: true, closed: false, waitlist: true }).action, 'waitlist', 'waitlist');
eq(rsvpState({ full: true, closed: false, waitlist: false }).label, 'Full', 'full');
eq(rsvpState({ full: false, closed: true, waitlist: false }).action, 'none', 'closed');
eq(rsvpState(null, 'confirmed').action, 'ticket', 'mine');
const csv = guestListCsv({
  event_id: 'e', title: 't', confirmed: 1, waitlisted: 0, checked_in: 0,
  items: [{ registration_id: 'r', name: '=cmd', email: 'a@b.c', status: 'confirmed', ticket_code: 'ABCDEFGH', created_at: 'x' }],
});
eq(csv.split('\n')[1], "'=cmd,a@b.c,confirmed,ABCD-EFGH,x,", 'csv');
console.log('ok  rsvp states, codes and csv');
