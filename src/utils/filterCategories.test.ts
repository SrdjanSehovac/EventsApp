import type { CategoryNode } from '../types/categories';
import {
  FILTER_CATEGORY_GROUPS,
  collectNodeSlugs,
  countSelectedFilterGroups,
  expandFilterGroupSlugs,
  isFilterGroupSelected,
  toggleFilterGroupSlugs,
} from './filterCategories';

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${name}: ${a} !== ${e}`);
  }
  console.log(`ok  ${name}`);
}

check('shows exactly 12 curated groups', FILTER_CATEGORY_GROUPS.length, 12);

check(
  'group labels and order',
  FILTER_CATEGORY_GROUPS.map((group) => group.label),
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

const leafLabels = [
  'Classical',
  'DJ/Electronic',
  'All-Ages',
  'All-Ages Activity',
  'Stand-Up',
  'Activism',
];
check(
  'does not list leaf categories as groups',
  leafLabels.some((label) =>
    FILTER_CATEGORY_GROUPS.some((group) => group.label === label),
  ),
  false,
);

const music = FILTER_CATEGORY_GROUPS.find((group) => group.id === 'music')!;
const nightlife = FILTER_CATEGORY_GROUPS.find((group) => group.id === 'nightlife')!;
const family = FILTER_CATEGORY_GROUPS.find((group) => group.id === 'family')!;

check('classical folds into Music', music.slugs.includes('classical'), true);
check(
  'DJ/Electronic folds into Nightlife',
  nightlife.slugs.includes('dj_electronic'),
  true,
);
check(
  'All-Ages folds into Family',
  family.slugs.includes('all_ages_activity') && family.slugs.includes('family'),
  true,
);

const tree: CategoryNode[] = [
  {
    category_id: 'n1',
    name: 'Nightlife',
    slug: 'nightlife',
    children: [
      { category_id: 'n2', name: 'Late Night', slug: 'late_night' },
    ],
  },
  {
    category_id: 'm1',
    name: 'Music',
    slug: 'music',
    children: [
      { category_id: 'm2', name: 'Classical', slug: 'classical' },
      {
        category_id: 'm3',
        name: 'Jazz',
        slug: 'jazz_blues',
        children: [{ category_id: 'm4', name: 'Jam', slug: 'jazz_jam' }],
      },
    ],
  },
];

const expandedNightlife = expandFilterGroupSlugs(nightlife, tree);
check(
  'nightlife expands parent, listed leaves, and API children',
  ['nightlife', 'dj_electronic', 'late_night'].every((slug) =>
    expandedNightlife.includes(slug),
  ),
  true,
);

const expandedMusic = expandFilterGroupSlugs(music, tree);
check(
  'music expansion includes nested jazz_jam',
  expandedMusic.includes('jazz_jam') && expandedMusic.includes('classical'),
  true,
);

check(
  'collectNodeSlugs includes the node itself',
  collectNodeSlugs(tree[1]).sort(),
  ['classical', 'jazz_blues', 'jazz_jam', 'music'].sort(),
);

const selected = toggleFilterGroupSlugs([], expandedMusic);
check(
  'checking Music sends every mapped slug',
  music.slugs.every((slug) => selected.includes(slug)),
  true,
);
check(
  'Music group counts as one filter',
  countSelectedFilterGroups(selected),
  1,
);
check(
  'Music is selected after toggle on',
  isFilterGroupSelected(selected, expandedMusic),
  true,
);

const cleared = toggleFilterGroupSlugs(selected, expandedMusic);
check('unchecking Music removes its slugs', cleared, []);

const musicAndFamily = toggleFilterGroupSlugs(selected, family.slugs);
check(
  'Music + Family count as two filters, not leaf slugs',
  countSelectedFilterGroups(musicAndFamily),
  2,
);

console.log('ok  filterCategories');
