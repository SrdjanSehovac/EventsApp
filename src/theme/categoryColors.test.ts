import { FILTER_CATEGORY_GROUPS, FILTER_CATEGORY_UI_LABELS } from '../utils/filterCategories';
import {
  CLEARANCE_PIN,
  DEFAULT_PIN,
  FILTER_GROUP_FAMILY,
  PIN_FAMILIES,
  colorForCategory,
} from './categoryColors';

const NIGHT_OUT = PIN_FAMILIES.night_out;
const CULTURE = PIN_FAMILIES.culture;
const EAT_SHOP = PIN_FAMILIES.eat_shop;
const ACTIVE = PIN_FAMILIES.active;
const FAMILY = PIN_FAMILIES.family;
const GATHER = PIN_FAMILIES.gather_learn;

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

function pin(slug: string, name?: string) {
  return colorForCategory({ slug, name: name ?? slug });
}

check('exactly 6 pin family hues', Object.keys(PIN_FAMILIES).length, 6);
check(
  'hues are the locked palette',
  PIN_FAMILIES,
  {
    night_out: '#DB2777',
    culture: '#7C3AED',
    eat_shop: '#EA580C',
    active: '#0284C7',
    family: '#F59E0B',
    gather_learn: '#15803D',
  },
);
check('unknown default is slate not emerald', DEFAULT_PIN, '#78716C');
check('clearance is darker orange', CLEARANCE_PIN, '#B45309');

check('still 12 filter groups', FILTER_CATEGORY_GROUPS.length, 12);
check(
  'filter chip labels unchanged',
  FILTER_CATEGORY_UI_LABELS,
  [
    'Nightlife',
    'Music',
    'Comedy',
    'Arts',
    'Food & Drink',
    'Markets',
    'Sales',
    'Festivals',
    'Sports & Fitness',
    'Family',
    'Workshops',
    'Community',
  ],
);
check(
  'every filter group has a pin family',
  FILTER_CATEGORY_GROUPS.every((group) => Boolean(FILTER_GROUP_FAMILY[group.id])),
  true,
);

const familyByGroup: Record<string, string> = {
  nightlife: NIGHT_OUT,
  music: NIGHT_OUT,
  comedy: CULTURE,
  arts: CULTURE,
  food_drink: EAT_SHOP,
  markets: EAT_SHOP,
  sales: EAT_SHOP,
  festivals: CULTURE,
  sports_fitness: ACTIVE,
  family: FAMILY,
  workshops: GATHER,
  community: GATHER,
};

for (const group of FILTER_CATEGORY_GROUPS) {
  const expected = familyByGroup[group.id];
  check(`parent ${group.id} pin`, pin(group.id), expected);
  for (const slug of group.slugs) {
    const want = slug === 'clearance' ? CLEARANCE_PIN : expected;
    check(`child ${slug} → ${group.label} family`, pin(slug), want);
  }
}

check('hyphenated jazz-blues is night out', pin('jazz-blues'), NIGHT_OUT);
check('Jazz/Blues name is night out', colorForCategory({ slug: '', name: 'Jazz/Blues' }), NIGHT_OUT);
check('DJ/Electronic name is night out', colorForCategory({ slug: '', name: 'DJ/Electronic' }), NIGHT_OUT);
check('retail_clearance is darker orange', pin('retail_clearance'), CLEARANCE_PIN);
check('sale shares eat & shop orange', pin('sale'), EAT_SHOP);
check('sales shares eat & shop orange', pin('sales'), EAT_SHOP);
check('missing category is slate', colorForCategory(null), DEFAULT_PIN);
check('empty slug is slate', colorForCategory({ slug: '', name: '' }), DEFAULT_PIN);
check('unknown tech is slate not emerald', pin('tech'), DEFAULT_PIN);
check('unknown does not use chrome emerald', pin('tech') === '#0F766E', false);
check('wholesale is not a sale pin', pin('wholesale'), DEFAULT_PIN);

const uniquePinColors = new Set(
  FILTER_CATEGORY_GROUPS.flatMap((group) =>
    group.slugs.map((slug) => pin(slug)),
  ),
);
check('mapped pins use at most 6 hues plus clearance', uniquePinColors.size <= 7, true);
check('night out is in mapped set', uniquePinColors.has(NIGHT_OUT), true);
check('culture is in mapped set', uniquePinColors.has(CULTURE), true);
check('eat shop is in mapped set', uniquePinColors.has(EAT_SHOP), true);
check('active is in mapped set', uniquePinColors.has(ACTIVE), true);
check('family is in mapped set', uniquePinColors.has(FAMILY), true);
check('gather is in mapped set', uniquePinColors.has(GATHER), true);
check('clearance darker orange is in mapped set', uniquePinColors.has(CLEARANCE_PIN), true);

console.log('all category-color checks passed');
