import type { CategoryBrief } from '../types/events';
import { FILTER_CATEGORY_GROUPS } from '../utils/filterCategories';

/**
 * Six pin families. The Filters sheet still shows 12 group chips;
 * related groups share a hue on map/list pins and category tints.
 */
export const PIN_FAMILIES = {
  night_out: '#DB2777',
  culture: '#7C3AED',
  eat_shop: '#EA580C',
  active: '#0284C7',
  family: '#F59E0B',
  gather_learn: '#15803D',
} as const;

export type PinFamily = keyof typeof PIN_FAMILIES;

/** Slightly darker orange within Eat & shop — already used for Clearance. */
export const CLEARANCE_PIN = '#B45309';

/** Unknown / uncategorised pins. Slate, not emerald chrome (`#0F766E`). */
export const DEFAULT_PIN = '#78716C';

/**
 * 12 filter groups → 6 pin families.
 * Keys are `FILTER_CATEGORY_GROUPS[].id`.
 */
export const FILTER_GROUP_FAMILY: Record<string, PinFamily> = {
  nightlife: 'night_out',
  music: 'night_out',
  arts: 'culture',
  comedy: 'culture',
  festivals: 'culture',
  food_drink: 'eat_shop',
  markets: 'eat_shop',
  sales: 'eat_shop',
  sports_fitness: 'active',
  family: 'family',
  workshops: 'gather_learn',
  community: 'gather_learn',
};

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/-/g, '_');
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildSlugColorMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const group of FILTER_CATEGORY_GROUPS) {
    const family = FILTER_GROUP_FAMILY[group.id];
    if (!family) {
      throw new Error(`Filter group "${group.id}" has no pin family`);
    }
    const color = PIN_FAMILIES[family];
    map[normalizeSlug(group.id)] = color;
    map[slugify(group.label)] = color;
    for (const slug of group.slugs) {
      const key = normalizeSlug(slug);
      map[key] = key === 'clearance' ? CLEARANCE_PIN : color;
    }
  }
  return map;
}

const SLUG_TO_COLOR = buildSlugColorMap();

function colorForSlug(key: string): string | undefined {
  if (!key) return undefined;
  const exact = SLUG_TO_COLOR[key];
  if (exact) return exact;

  // Longest contiguous segment: `retail_clearance` → clearance, not a hash hue.
  const parts = key.split('_').filter(Boolean);
  let best: string | undefined;
  let bestLen = 0;
  for (let i = 0; i < parts.length; i += 1) {
    let acc = '';
    for (let j = i; j < parts.length; j += 1) {
      acc = acc ? `${acc}_${parts[j]}` : parts[j];
      const color = SLUG_TO_COLOR[acc];
      const len = j - i + 1;
      if (color && len >= bestLen) {
        best = color;
        bestLen = len;
      }
    }
  }
  return best;
}

export function colorForCategory(
  category?: Pick<CategoryBrief, 'slug' | 'name'> | null,
): string {
  const slugKey = slugify(category?.slug ?? '');
  const nameKey = slugify(category?.name ?? '');
  return colorForSlug(slugKey) ?? colorForSlug(nameKey) ?? DEFAULT_PIN;
}

export function tintForCategory(
  category?: Pick<CategoryBrief, 'slug' | 'name'> | null,
  alpha = '22',
): string {
  return `${colorForCategory(category)}${alpha}`;
}
