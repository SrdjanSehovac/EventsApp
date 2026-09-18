import type { CategoryNode } from '../types/categories';

export type FilterCategoryGroup = {
  id: string;
  label: string;
  /** Canonical slugs sent when this group is checked. */
  slugs: readonly string[];
};

/** Hard cap for Filters UI rows. Never list API leaf slugs. */
export const MAX_FILTER_CATEGORY_OPTIONS = 15;

/**
 * Curated filter groups for the browse sheet — the only rows the Filters UI may show.
 * Leaves (Karaoke, Jazz/Blues, Classical, DJ/Electronic, All-Ages, Stand-Up, …)
 * fold into these parents and are sent as slugs, never rendered as their own rows.
 */
export const FILTER_CATEGORY_GROUPS: readonly FilterCategoryGroup[] = [
  {
    id: 'nightlife',
    label: 'Nightlife',
    slugs: [
      'nightlife',
      'dj_electronic',
      'club_party',
      'karaoke',
      'queer_nightlife',
      'bars_nightlife_food',
    ],
  },
  {
    id: 'music',
    label: 'Music',
    slugs: ['music', 'live_music', 'jazz_blues', 'classical', 'open_mic'],
  },
  {
    id: 'comedy',
    label: 'Comedy',
    slugs: ['comedy', 'stand_up', 'improv'],
  },
  {
    id: 'arts',
    label: 'Arts',
    slugs: ['arts', 'exhibition', 'theatre', 'film', 'dance', 'literary'],
  },
  {
    id: 'food_drink',
    label: 'Food & Drink',
    slugs: ['food_drink', 'tasting', 'food_festival', 'pop_up'],
  },
  {
    id: 'markets',
    label: 'Markets',
    slugs: ['markets', 'farmers_market', 'flea_vintage', 'holiday_market'],
  },
  {
    id: 'sales',
    label: 'Sales',
    slugs: ['sales', 'sale', 'clearance'],
  },
  {
    id: 'festivals',
    label: 'Festivals',
    slugs: ['festivals', 'cultural_festival', 'outdoor_festival'],
  },
  {
    id: 'sports_fitness',
    label: 'Sports & Fitness',
    slugs: ['sports_fitness', 'spectator_sport', 'participatory', 'wellness'],
  },
  {
    id: 'family',
    label: 'Family',
    slugs: ['family', 'kids_family', 'all_ages_activity'],
  },
  {
    id: 'workshops',
    label: 'Workshops',
    slugs: ['workshops', 'class_workshop'],
  },
  {
    id: 'community',
    label: 'Community',
    slugs: [
      'community',
      'networking',
      'activism',
      'charity_fundraiser',
      'talk_panel',
    ],
  },
];

if (FILTER_CATEGORY_GROUPS.length > MAX_FILTER_CATEGORY_OPTIONS) {
  throw new Error(
    `Filters UI may list at most ${MAX_FILTER_CATEGORY_OPTIONS} category groups`,
  );
}

/** Labels shown in the Filters sheet. Never include leaf names. */
export const FILTER_CATEGORY_UI_LABELS: readonly string[] =
  FILTER_CATEGORY_GROUPS.map((group) => group.label);

const BANNED_FILTER_ROW_NEEDLES = [
  'jazz',
  'karaoke',
  'classical',
  'dj',
  'electronic',
  'all-ages',
  'all ages',
  'stand-up',
  'standup',
  'activism',
  'open mic',
  'improv',
] as const;

export function assertNoLeafFilterRows(labels: readonly string[] = FILTER_CATEGORY_UI_LABELS) {
  const hits = labels.filter((label) => {
    const lower = label.toLowerCase();
    return BANNED_FILTER_ROW_NEEDLES.some((needle) => lower.includes(needle));
  });
  if (hits.length > 0) {
    throw new Error(`Leaf categories must not be filter rows: ${hits.join(', ')}`);
  }
}

assertNoLeafFilterRows();

export function normalizeCategorySlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/-/g, '_');
}

function walkCategories(
  nodes: CategoryNode[],
  visit: (node: CategoryNode) => void,
): void {
  for (const node of nodes) {
    visit(node);
    if (node.children?.length) walkCategories(node.children, visit);
  }
}

/** Parent slug plus every descendant, using the API tree when present. */
export function expandGroupSlugs(
  group: FilterCategoryGroup,
  tree: CategoryNode[] = [],
): string[] {
  const out = new Set<string>(group.slugs);
  const wanted = new Set(group.slugs.map(normalizeCategorySlug));

  walkCategories(tree, (node) => {
    if (!node.slug) return;
    if (!wanted.has(normalizeCategorySlug(node.slug))) return;
    out.add(node.slug);
    walkCategories(node.children ?? [], (child) => {
      if (child.slug) out.add(child.slug);
    });
  });

  return [...out];
}

export function isFilterGroupSelected(
  selectedSlugs: string[],
  group: FilterCategoryGroup,
): boolean {
  const selected = new Set(selectedSlugs.map(normalizeCategorySlug));
  return group.slugs.every((slug) => selected.has(normalizeCategorySlug(slug)));
}

export function toggleFilterGroup(
  selectedSlugs: string[],
  group: FilterCategoryGroup,
  tree: CategoryNode[] = [],
): string[] {
  const expanded = expandGroupSlugs(group, tree);
  const expandedKeys = new Set(expanded.map(normalizeCategorySlug));
  if (isFilterGroupSelected(selectedSlugs, group)) {
    return selectedSlugs.filter(
      (slug) => !expandedKeys.has(normalizeCategorySlug(slug)),
    );
  }
  const next = new Set(selectedSlugs);
  for (const slug of expanded) next.add(slug);
  return [...next];
}

export function countSelectedFilterGroups(selectedSlugs: string[]): number {
  return FILTER_CATEGORY_GROUPS.filter((group) =>
    isFilterGroupSelected(selectedSlugs, group),
  ).length;
}

/** Expand checked groups to the slugs the API should receive. */
export function expandSelectedCategorySlugs(
  selectedSlugs: string[],
  tree: CategoryNode[] = [],
): string[] {
  const selectedGroups = FILTER_CATEGORY_GROUPS.filter((group) =>
    isFilterGroupSelected(selectedSlugs, group),
  );
  if (selectedGroups.length === 0) return selectedSlugs;
  const out = new Set<string>();
  for (const group of selectedGroups) {
    for (const slug of expandGroupSlugs(group, tree)) out.add(slug);
  }
  return [...out];
}
