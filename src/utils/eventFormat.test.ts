import { formatPinBadge, formatSaleBadge, resolveSaleKind } from './eventFormat';

const salesCategory = { name: 'Sales', slug: 'sales' };
const musicCategory = { name: 'Music', slug: 'music' };
const clearanceCategory = { name: 'Clearance', slug: 'retail-clearance' };

function check(name: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(
      `${name}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`,
    );
  }
  console.log(`ok  ${name}`);
}

check(
  'sale_kind clearance wins even with a price',
  formatPinBadge({
    sale_kind: 'clearance',
    is_free: false,
    price_min_cad: 5,
    title: 'Rack markdowns',
  }),
  'Clearance',
);

check(
  'sale_kind sale wins over dollar amounts',
  formatPinBadge({
    sale_kind: 'sale',
    price_min_cad: 12,
    price_max_cad: 20,
    title: 'Sample rack',
  }),
  'Sale',
);

check(
  'Sales category without sale_kind',
  formatPinBadge({
    title: 'Neighbourhood pop-up',
    primary_category: salesCategory,
    is_free: false,
  }),
  'Sale',
);

check(
  'clearance in category slug/name',
  formatPinBadge({
    title: 'End of line',
    primary_category: clearanceCategory,
  }),
  'Clearance',
);

check(
  'warehouse sale title',
  formatPinBadge({ title: 'Winners warehouse sale' }),
  'Sale',
);

check(
  'trunk sale title',
  formatPinBadge({ title: 'Designer trunk sale this weekend' }),
  'Sale',
);

check(
  'back to school sale title',
  formatPinBadge({ title: 'Back to school sale' }),
  'Sale',
);

check(
  'clearance in title beats sale_kind sale',
  formatPinBadge({
    sale_kind: 'sale',
    title: 'Storewide clearance',
  }),
  'Clearance',
);

check(
  'explicit free stays Free',
  formatPinBadge({
    title: 'Community concert',
    primary_category: musicCategory,
    is_free: true,
  }),
  'Free',
);

check(
  'single amount',
  formatPinBadge({
    title: 'Club night',
    primary_category: musicCategory,
    price_min_cad: 5,
  }),
  '$5',
);

check(
  'range uses en dash',
  formatPinBadge({
    title: 'Festival',
    price_min_cad: 12,
    price_max_cad: 20,
  }),
  '$12–$20',
);

check(
  'paid unknown amount is $',
  formatPinBadge({
    title: 'Door cover',
    is_free: false,
  }),
  '$',
);

check(
  'missing price is not invented as Free',
  formatPinBadge({
    title: 'Mystery gig',
    primary_category: musicCategory,
  }),
  '',
);

check(
  'tickets on sale is not a retail Sale',
  formatPinBadge({
    title: 'Jazz night — tickets on sale',
    primary_category: musicCategory,
    price_min_cad: 25,
  }),
  '$25',
);

check(
  'wholesale category is not Sale',
  resolveSaleKind({
    title: 'Trade day',
    primary_category: { name: 'Wholesale', slug: 'wholesale' },
  }),
  null,
);

check(
  'formatSaleBadge null for concerts',
  formatSaleBadge({
    title: 'Open mic',
    primary_category: musicCategory,
  }),
  null,
);

console.log('all pin-badge checks passed');
