import { PRODUCT_CITIES, type ProductCity } from '../config/cities';
import { NEIGHBOURHOODS, type NeighbourhoodPlace } from '../config/neighbourhoods';

export type PlaceMatch = {
  kind: 'city' | 'neighbourhood';
  key: string;
  title: string;
  subtitle: string;
  citySlug: string;
  lat: number;
  lng: number;
  /** Neighbourhood camera. Cities use the product-city radius instead. */
  zoom: number | null;
  /** Match strength; higher is better. */
  score: number;
};

export type PlaceSearchResult = {
  cities: PlaceMatch[];
  neighbourhoods: PlaceMatch[];
};

const CITY_LIMIT = 6;
const NEIGHBOURHOOD_LIMIT = 8;

/** Lowercase, strip accents, and turn punctuation into spaces. */
export function foldPlaceText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Insert, delete, substitute, or an adjacent swap. Returns budget + 1 when farther. */
function editDistance(a: string, b: string, budget: number): number {
  if (Math.abs(a.length - b.length) > budget) return budget + 1;
  if (a === b) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    let best = dp[i][0];
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let next = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        next = Math.min(next, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = next;
      if (next < best) best = next;
    }
    if (best > budget) return budget + 1;
  }
  return dp[a.length][b.length];
}

function fuzzyBudget(query: string): number {
  if (query.length < 4) return 0;
  return query.length >= 8 ? 2 : 1;
}

/** Higher is a better match. Zero means no match. */
export function scorePlaceText(query: string, label: string): number {
  const q = foldPlaceText(query);
  const t = foldPlaceText(label);
  if (!q || !t) return 0;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 860;
  if (q.startsWith(t) && t.length >= 4) return 840;
  const qWords = q.split(' ');
  const tWords = t.split(' ');
  if (qWords.length > 1 && qWords.every((word) => wordMatches(word, tWords))) {
    return 820;
  }
  if (tWords.some((word) => word.startsWith(q))) return 760;
  if (q.length >= 4 && t.includes(q)) return 640;
  if (qWords.length === 1) {
    const budget = fuzzyBudget(q);
    if (budget > 0 && editDistance(q, t, budget) <= budget) return 520;
    if (budget > 0) {
      for (const word of tWords) {
        if (editDistance(q, word, budget) <= budget) return 500;
      }
    }
  }
  return 0;
}

function wordMatches(word: string, words: string[]): boolean {
  const budget = fuzzyBudget(word);
  return words.some(
    (candidate) =>
      candidate.startsWith(word) ||
      (budget > 0 && editDistance(word, candidate, budget) <= budget),
  );
}

function bestScore(query: string, labels: readonly string[]): number {
  let best = 0;
  for (const label of labels) {
    const score = scorePlaceText(query, label);
    if (score > best) best = score;
  }
  return best;
}

function cityLabels(city: ProductCity): string[] {
  return [city.name, city.slug, ...(city.aliases ?? [])];
}

function neighbourhoodLabels(
  place: NeighbourhoodPlace,
  city: ProductCity,
): string[] {
  const names = [place.name, ...(place.aliases ?? [])];
  const cityNames = [city.name, ...(city.aliases ?? [])];
  const combined = names.flatMap((name) =>
    cityNames.flatMap((cityName) => [`${name} ${cityName}`, `${cityName} ${name}`]),
  );
  return [...names, ...combined];
}

function ranked<T>(
  rows: { score: number; match: T; title: string }[],
  limit: number,
): T[] {
  return rows
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map((row) => row.match);
}

const CACHE_LIMIT = 200;
const cache = new Map<string, PlaceSearchResult>();

/** Cached: retyping or backspacing never redoes the fuzzy scan. */
export function searchPlaces(
  query: string,
  options?: { citySlug?: string | null },
): PlaceSearchResult {
  const key = `${options?.citySlug ?? ''}|${foldPlaceText(query)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const result = computePlaces(query, options);
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, result);
  return result;
}

/**
 * The place Return should jump to: the best city when it is an exact or
 * prefix hit, otherwise the best of cities and neighbourhoods.
 */
export function topPlace(result: PlaceSearchResult): PlaceMatch | null {
  const city = result.cities[0] ?? null;
  const hood = result.neighbourhoods[0] ?? null;
  if (!city) return hood;
  if (!hood || city.score >= 840 || city.score >= hood.score) return city;
  return hood;
}

function computePlaces(
  query: string,
  options?: { citySlug?: string | null },
): PlaceSearchResult {
  const folded = foldPlaceText(query);
  if (!folded) return { cities: [], neighbourhoods: [] };
  const preferred = options?.citySlug ?? null;
  const boost = (citySlug: string, score: number) =>
    score > 0 && citySlug === preferred ? score + 25 : score;

  const cityRows = PRODUCT_CITIES.map((city) => {
    const score = boost(city.slug, bestScore(query, cityLabels(city)));
    const match: PlaceMatch = {
      kind: 'city',
      key: `city:${city.slug}`,
      title: city.name,
      subtitle: city.province,
      citySlug: city.slug,
      lat: city.lat,
      lng: city.lng,
      zoom: null,
      score,
    };
    return { score, match, title: city.name };
  }).filter((row) => row.score > 0);

  const neighbourhoodRows = NEIGHBOURHOODS.flatMap((place) => {
    const city = PRODUCT_CITIES.find((item) => item.slug === place.citySlug);
    if (!city) return [];
    const ownScore = bestScore(query, neighbourhoodLabels(place, city));
    const cityScore = bestScore(query, cityLabels(city));
    // A city query should still offer that city's neighbourhoods, under the city hit.
    const score = boost(
      place.citySlug,
      ownScore > 0 ? ownScore : cityScore >= 840 ? cityScore - 200 : 0,
    );
    if (score <= 0) return [];
    const match: PlaceMatch = {
      kind: 'neighbourhood',
      key: `neighbourhood:${place.citySlug}:${foldPlaceText(place.name)}`,
      title: place.name,
      subtitle: city.name,
      citySlug: place.citySlug,
      lat: place.lat,
      lng: place.lng,
      zoom: place.zoom,
      score,
    };
    return [{ score, match, title: place.name }];
  });

  return {
    cities: ranked(cityRows, CITY_LIMIT),
    neighbourhoods: ranked(neighbourhoodRows, NEIGHBOURHOOD_LIMIT),
  };
}
