/**
 * Pick the sharpest URL we already have for one photo.
 * A copy with no size hint outranks `?w=400`. A different file is left alone.
 * Signed query strings are not rewritten.
 */

function sizeHint(url: string): number {
  try {
    const parsed = new URL(url);
    let best = 0;
    let saw = false;
    for (const key of ['w', 'width', 'h', 'height']) {
      const value = Number(parsed.searchParams.get(key));
      if (Number.isFinite(value) && value > 0) {
        saw = true;
        best = Math.max(best, value);
      }
    }
    const frame = parsed.pathname.match(/(\d{2,5})x(\d{2,5})/);
    if (frame) {
      saw = true;
      best = Math.max(best, Number(frame[1]), Number(frame[2]));
    }
    return saw ? best : Number.POSITIVE_INFINITY;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function identity(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/(\d{2,5})x(\d{2,5})/g, '');
    return `${parsed.origin}${path}`;
  } catch {
    return url;
  }
}

export function largestImageUrl(
  url: string,
  candidates: readonly string[] = [],
): string {
  const id = identity(url);
  let best = url;
  let bestSize = sizeHint(url);
  for (const candidate of candidates) {
    if (!candidate || identity(candidate) !== id) continue;
    const size = sizeHint(candidate);
    if (size > bestSize) {
      best = candidate;
      bestSize = size;
    }
  }
  return best;
}
