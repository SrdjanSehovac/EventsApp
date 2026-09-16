type PlaceLike = {
  neighbourhood?: string | null;
  city?: string | null;
};

type PriceLike = {
  is_free?: boolean | null;
};

type WhenLike = {
  starts_at?: string | null;
};

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

export function formatEventPrice(item: PriceLike): string | null {
  if (item.is_free === true) return 'Free';
  if (item.is_free === false) return '$';
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

export function formatPinBadge(item: PriceLike & WhenLike): string {
  const parts = [formatPinTime(item.starts_at), formatEventPrice(item)].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(' · ') : 'Event';
}
