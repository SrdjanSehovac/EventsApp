import type { CategoryBrief } from '../types/events';

/** Saturated palette used when a slug does not match a named category. */
const FALLBACK_PALETTE = [
  '#0E8A7D',
  '#2563EB',
  '#7C3AED',
  '#EA580C',
  '#DB2777',
  '#CA8A04',
  '#0284C7',
  '#059669',
] as const;

const NAMED_COLORS: Record<string, string> = {
  music: '#7C3AED',
  concert: '#7C3AED',
  gig: '#6D28D9',
  nightlife: '#DB2777',
  night: '#DB2777',
  party: '#E11D48',
  food: '#EA580C',
  drink: '#C2410C',
  dining: '#EA580C',
  restaurant: '#EA580C',
  sports: '#0284C7',
  fitness: '#0D9488',
  wellness: '#14B8A6',
  arts: '#C026D3',
  art: '#C026D3',
  theatre: '#A21CAF',
  theater: '#A21CAF',
  comedy: '#CA8A04',
  community: '#16A34A',
  family: '#F59E0B',
  kids: '#F59E0B',
  education: '#2563EB',
  workshop: '#1D4ED8',
  business: '#4F46E5',
  market: '#D97706',
  festival: '#E11D48',
  outdoor: '#059669',
  outdoors: '#059669',
  film: '#7C3AED',
  movie: '#6D28D9',
  tech: '#0F766E',
};

const DEFAULT_PIN = '#24356D';

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function colorForCategory(
  category?: Pick<CategoryBrief, 'slug' | 'name'> | null,
): string {
  const key = (category?.slug || category?.name || '').trim().toLowerCase();
  if (!key) return DEFAULT_PIN;

  for (const [needle, color] of Object.entries(NAMED_COLORS)) {
    if (key.includes(needle)) return color;
  }

  return FALLBACK_PALETTE[hashKey(key) % FALLBACK_PALETTE.length];
}

export function tintForCategory(
  category?: Pick<CategoryBrief, 'slug' | 'name'> | null,
  alpha = '22',
): string {
  return `${colorForCategory(category)}${alpha}`;
}
