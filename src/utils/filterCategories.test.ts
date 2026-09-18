import type { CategoryNode } from '../types/categories';
import {
  FILTER_CATEGORY_GROUPS,
  countSelectedFilterGroups,
  expandGroupSlugs,
  expandSelectedCategorySlugs,
  isFilterGroupSelected,
  toggleFilterGroup,
} from './filterCategories';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

function hasSlug(groupId: string, slug: string): boolean {
  const group = FILTER_CATEGORY_GROUPS.find((item) => item.id === groupId);
  return Boolean(group?.slugs.includes(slug));
}

check('twelve curated groups', FILTER_CATEGORY_GROUPS.length, 12);
check(
  'labels in product order',
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

check('classical folds into Music', hasSlug('music', 'classical'), true);
check('DJ/Electronic folds into Nightlife', hasSlug('nightlife', 'dj_electronic'), true);
check('All-Ages folds into Family', hasSlug('family', 'all_ages_activity'), true);
check('kids_family folds into Family', hasSlug('family', 'kids_family'), true);

const music = FILTER_CATEGORY_GROUPS.find((group) => group.id === 'music')!;
const nightlife = FILTER_CATEGORY_GROUPS.find((group) => group.id === 'nightlife')!;

check(
  'Music sends parent plus listed children',
  expandGroupSlugs(music),
  ['music', 'live_music', 'jazz_blues', 'classical', 'open_mic'],
);

const nightlifeTree: CategoryNode[] = [
  {
    category_id: 'n',
    name: 'Nightlife',
    slug: 'nightlife',
    children: [
      { category_id: 'dj', name: 'DJ/Electronic', slug: 'dj_electronic' },
      { category_id: 'after', name: 'After Hours', slug: 'after_hours' },
    ],
  },
];

const nightlifeSlugs = expandGroupSlugs(nightlife, nightlifeTree);
check(
  'Nightlife includes listed slugs',
  nightlife.slugs.every((slug) => nightlifeSlugs.includes(slug)),
  true,
);
check(
  'Nightlife expands extra API children',
  nightlifeSlugs.includes('after_hours'),
  true,
);

let selected: string[] = [];
selected = toggleFilterGroup(selected, music);
check('checking Music selects the group', isFilterGroupSelected(selected, music), true);
check(
  'checking Music sends all Music slugs',
  music.slugs.every((slug) => selected.includes(slug)),
  true,
);
check('one group counts as one active filter', countSelectedFilterGroups(selected), 1);

selected = toggleFilterGroup(selected, nightlife, nightlifeTree);
check('two groups count as two', countSelectedFilterGroups(selected), 2);
check(
  'API request expands both groups',
  expandSelectedCategorySlugs(selected, nightlifeTree).includes('after_hours') &&
    expandSelectedCategorySlugs(selected, nightlifeTree).includes('classical'),
  true,
);

selected = toggleFilterGroup(selected, music);
check('unchecking Music leaves Nightlife', isFilterGroupSelected(selected, music), false);
check('Nightlife stays selected', isFilterGroupSelected(selected, nightlife), true);

console.log('all filter-category checks passed');
