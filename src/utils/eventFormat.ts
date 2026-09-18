import type { SaleKind } from '../types/events';

type PlaceLike = {
  neighbourhood?: string | null;
  city?: string | null;
};

type PriceLike = {
  is_free?: boolean | null;
  price_min_cad?: number | string | null;
  price_max_cad?: number | string | null;
  price_notes?: string | null;
};

type CategoryLike = {
  name?: string | null;
  slug?: string | null;
};

type SaleLike = {
  title?: string | null;
  sale_kind?: SaleKind | null;
  primary_category?: CategoryLike | null;
};

type WhenLike = {
  starts_at?: string | null;
};

const CLEARANCE_IN_TEXT = /\bclearance\b/i;
const SALE_IN_CATEGORY = /\bsales?\b/i;
const ON_SALE_NOISE = /\b(?:tickets?\s+)?on\s+sale\b/i;
const SALE_IN_TITLE =
  /\b(?:warehouse|trunk|garage|yard|sidewalk|sample|tent)\s+sales?\b|\bback[\s-]*to[\s-]*school\s+sales?\b|\bsales?\s*$/i;

function categoryBlob(category?: CategoryLike | null): string {
  if (!category) return '';
  return `${category.slug ?? ''} ${category.name ?? ''}`
    .toLowerCase()
    .replace(/[-_]+/g, ' ');
}

export function formatEventWhen(value?: string | null): string {
  if (!value) return 'Schedule TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Schedule TBD';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatPinTime(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatEventPlace(item: PlaceLike): string {
  const parts = [item.neighbourhood, item.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Location TBD';
}

function toPriceNumber(value?: number | string | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatCadAmount(value: number): string {
  const whole = Math.abs(value - Math.round(value)) < 0.001;
  return whole ? `$${Math.round(value)}` : `$${value.toFixed(2)}`;
}

export function formatEventPrice(item: PriceLike): string | null {
  const min = toPriceNumber(item.price_min_cad);
  const max = toPriceNumber(item.price_max_cad);

  if (min !== null) {
    if (max !== null && max !== min) {
      return `${formatCadAmount(min)}–${formatCadAmount(max)}`;
    }
    return formatCadAmount(min);
  }

  // Never invent Free from missing data — only when explicitly flagged
  // and no numeric amount is present.
  if (item.is_free === true) return 'Free';
  if (item.is_free === false) return '$';
  return null;
}

export function resolveSaleKind(item: SaleLike): SaleKind | null {
  const category = categoryBlob(item.primary_category);
  const title = item.title ?? '';

  if (
    item.sale_kind === 'clearance' ||
    CLEARANCE_IN_TEXT.test(category) ||
    CLEARANCE_IN_TEXT.test(title)
  ) {
    return 'clearance';
  }

  if (
    item.sale_kind === 'sale' ||
    SALE_IN_CATEGORY.test(category) ||
    (!ON_SALE_NOISE.test(title) && SALE_IN_TITLE.test(title))
  ) {
    return 'sale';
  }

  return null;
}

export function formatSaleBadge(item: SaleLike): 'Sale' | 'Clearance' | null {
  const kind = resolveSaleKind(item);
  if (kind === 'clearance') return 'Clearance';
  if (kind === 'sale') return 'Sale';
  return null;
}

export function formatFactsRow(
  item: PlaceLike & PriceLike & WhenLike,
): string {
  const parts = [
    formatEventWhen(item.starts_at),
    item.neighbourhood || item.city || null,
    formatEventPrice(item),
  ].filter((part): part is string => Boolean(part));
  return parts.join(' · ');
}

/** Map pin label: Sale/Clearance, else Free/$ amounts. Dates stay off badges. */
export function formatPinBadge(item: PriceLike & SaleLike): string {
  return formatSaleBadge(item) ?? formatEventPrice(item) ?? '';
}

/** Large listing fact — Sale / Clearance / Free / $ / start time. */
export function formatPriceLike(item: PriceLike & SaleLike & WhenLike): string {
  return (
    formatSaleBadge(item) ??
    formatEventPrice(item) ??
    formatPinTime(item.starts_at) ??
    'Soon'
  );
}

export function formatMetaRow(
  item: PlaceLike & WhenLike & { primary_category?: { name?: string } | null },
): string {
  const parts = [
    item.primary_category?.name,
    formatPinTime(item.starts_at),
  ].filter((part): part is string => Boolean(part));
  return parts.join(' · ');
}

export function formatRelativeWhen(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const absMin = Math.round(Math.abs(diffMs) / 60_000);

  if (Math.abs(diffMs) < 60_000) {
    return diffMs >= 0 ? 'Starting now' : 'Just started';
  }
  if (absMin < 60) {
    return diffMs >= 0 ? `in ${absMin} min` : `${absMin} min ago`;
  }

  const absHr = Math.round(absMin / 60);
  if (absHr < 24) {
    return diffMs >= 0
      ? `in ${absHr} hour${absHr === 1 ? '' : 's'}`
      : `${absHr} hour${absHr === 1 ? '' : 's'} ago`;
  }

  return formatPinTime(value);
}

export function formatPlaceLine(item: PlaceLike): string {
  if (item.neighbourhood && item.city) {
    return `${item.neighbourhood}, ${item.city}`;
  }
  return item.neighbourhood || item.city || 'Location TBD';
}
