import {
  FILTER_CATEGORY_GROUPS,
  normalizeCategorySlug,
} from './filterCategories';

export type ImageFallbackTile =
  | { kind: 'category'; slug: string; label: string }
  | { kind: 'campus'; slug: string; name: string };

/** Known campus slugs. Unknown slugs still get a readable name. */
const CAMPUS_NAMES: Record<string, string> = {
  western: 'Western University',
  algonquin: 'Algonquin College',
  uottawa: 'University of Ottawa',
  carleton: 'Carleton University',
  durham: 'Durham College',
};

function wordsFromSlug(slug: string): string[] {
  return slug
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .split('_')
    .filter(Boolean);
}

function titleFromSlug(slug: string): string {
  const words = wordsFromSlug(slug);
  if (!words.length) return '';
  return words
    .map((word, index) => {
      if ((word === 'of' || word === 'and' || word === 'the') && index > 0) {
        return word;
      }
      if (word === 'st' || word === 'saint') return 'St.';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function campusNameFromSlug(slug: string): string {
  const key = normalizeCategorySlug(slug);
  return CAMPUS_NAMES[key] ?? (titleFromSlug(slug) || 'Campus');
}

function categoryLabel(slug: string): { slug: string; label: string } {
  const key = normalizeCategorySlug(slug);
  const group = FILTER_CATEGORY_GROUPS.find(
    (entry) =>
      normalizeCategorySlug(entry.id) === key ||
      entry.slugs.some((item) => normalizeCategorySlug(item) === key),
  );
  if (group) return { slug: normalizeCategorySlug(group.id), label: group.label };
  return { slug: key, label: titleFromSlug(slug) || 'Event' };
}

/** `campus:western` or `category:music`. Anything else is ignored. */
export function parseImageFallback(value?: string | null): ImageFallbackTile | null {
  const raw = value?.trim().toLowerCase() ?? '';
  const split = raw.indexOf(':');
  if (split <= 0) return null;
  const kind = raw.slice(0, split);
  const slug = raw.slice(split + 1).trim();
  if (!slug || slug.includes(':')) return null;
  if (kind === 'campus') {
    return { kind: 'campus', slug: normalizeCategorySlug(slug), name: campusNameFromSlug(slug) };
  }
  if (kind === 'category') {
    const category = categoryLabel(slug);
    if (!category.label) return null;
    return { kind: 'category', slug: category.slug, label: category.label };
  }
  return null;
}
