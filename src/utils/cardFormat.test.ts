import { formatCardPlace, formatCardWhen } from './eventFormat';

const assert = {
  equal(a: unknown, b: unknown) {
    if (a !== b) throw new Error(`expected ${String(b)}, got ${String(a)}`);
  },
};

assert.equal(formatCardWhen('2026-10-14T23:30:00Z'), 'Wed Oct 14 · 7:30 PM');
assert.equal(formatCardWhen(null), 'Date TBD');
assert.equal(formatCardPlace({ venue_name: 'Roundhouse', city: 'London' }), 'Roundhouse · London');
assert.equal(formatCardPlace({ venue_name: 'London', city: 'London' }), 'London');
assert.equal(formatCardPlace({ venue_name: 'Toronto City Hall', city: 'Toronto' }), 'Toronto City Hall');
assert.equal(formatCardPlace({ neighbourhood: 'Leslieville', city: 'Toronto' }), 'Leslieville · Toronto');
assert.equal(formatCardPlace({}), null);
console.log('ok  card date and place lines');
