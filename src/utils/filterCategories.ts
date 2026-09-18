import type { CategoryNode } from '../types/categories';

export type FilterCategoryGroup = {
  id: string;
  label: string;
  /** Parent and leaf slugs this group represents in the filter UI. */
  slugs: string[];
};

/**
 * Curated filter groups shown in the Filters sheet.
 * Classical folds into Music; DJ/Electronic into Nightlife; All-Ages into Family.
 * Leaf categories are never listed as their own rows.
 */
export const FILTER_CATEGORY_GROUPS: FilterCategoryGroup[] = [
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

function walkNodes(
  nodes: CategoryNode[] | undefined,
  visit: (node: CategoryNode) => void,
) {
  if (!nodes?.length) return;
  for (const node of nodes) {
    visit(node);
    walkNodes(node.children, visit);
  }
}

export function findCategoryNode(
  tree: CategoryNode[],
  slug: string,
): CategoryNode | undefined {
  let found: CategoryNode | undefined;
  walkNodes(tree, (node) => {
    if (!found && node.slug === slug) found = node;
  });
  return found;
}

/** Collect slugs for a node and every descendant. */
export function collectNodeSlugs(node: CategoryNode): string[] {
  const slugs: string[] = [node.slug];
  walkNodes(node.children, (child) => slugs.push(child.slug));
  return slugs;
}

/**
 * Expand a group to every mapped slug, plus API children of those slugs.
 * Client-side expansion keeps the current categories query param working.
 */
export function expandFilterGroupSlugs(
  group: FilterCategoryGroup,
  tree: CategoryNode[] = [],
): string[] {
  const slugs = new Set(group.slugs);
  for (const slug of group.slugs) {
    const node = findCategoryNode(tree, slug);
    if (!node) continue;
    for (const childSlug of collectNodeSlugs(node)) {
      slugs.add(childSlug);
    }
  }
  return [...slugs];
}

export function isFilterGroupSelected(
  categorySlugs: string[],
  groupSlugs: string[],
): boolean {
  if (groupSlugs.length === 0) return false;
  const selected = new Set(categorySlugs);
  return groupSlugs.every((slug) => selected.has(slug));
}

export function toggleFilterGroupSlugs(
  categorySlugs: string[],
  groupSlugs: string[],
): string[] {
  if (isFilterGroupSelected(categorySlugs, groupSlugs)) {
    const drop = new Set(groupSlugs);
    return categorySlugs.filter((slug) => !drop.has(slug));
  }
  const next = new Set(categorySlugs);
  for (const slug of groupSlugs) next.add(slug);
  return [...next];
}

/** Count selected *groups*, not expanded leaf slugs. */
export function countSelectedFilterGroups(categorySlugs: string[]): number {
  return FILTER_CATEGORY_GROUPS.filter((group) =>
    isFilterGroupSelected(categorySlugs, group.slugs),
  ).length;
}
