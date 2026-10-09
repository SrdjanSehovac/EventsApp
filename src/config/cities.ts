/**
 * The 21 product cities EventServer serves.
 *
 * `name` is the plain picker label and the `city` string from
 * GET /v1/events/cities when it matches the registry examples
 * (`Ottawa`, `Quebec City`, `Kitchener`, `St. Catharines`).
 * `aliases` are the longer metro labels (Kitchener-Waterloo,
 * St. Catharines-Niagara) so a selected city still sends whatever
 * exact string the cities endpoint returned.
 *
 * Centres are downtown points. Selecting a city recentres the map
 * there at `radiusKm`. Toronto keeps the historical default camera.
 */

export type ProductCity = {
  slug: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  /** Camera and map-search radius after this city is selected. */
  radiusKm: number;
  aliases?: readonly string[];
};

export const PRODUCT_CITIES: readonly ProductCity[] = [
  {
    slug: 'toronto',
    name: 'Toronto',
    province: 'Ontario',
    lat: 43.6532,
    lng: -79.3832,
    radiusKm: 25,
  },
  {
    slug: 'montreal',
    name: 'Montreal',
    province: 'Quebec',
    lat: 45.5017,
    lng: -73.5673,
    radiusKm: 25,
    aliases: ['Montréal'],
  },
  {
    slug: 'vancouver',
    name: 'Vancouver',
    province: 'British Columbia',
    lat: 49.2827,
    lng: -123.1207,
    radiusKm: 22,
  },
  {
    slug: 'ottawa',
    name: 'Ottawa',
    province: 'Ontario',
    lat: 45.4215,
    lng: -75.6972,
    radiusKm: 25,
  },
  {
    slug: 'calgary',
    name: 'Calgary',
    province: 'Alberta',
    lat: 51.0447,
    lng: -114.0719,
    radiusKm: 25,
  },
  {
    slug: 'edmonton',
    name: 'Edmonton',
    province: 'Alberta',
    lat: 53.5461,
    lng: -113.4938,
    radiusKm: 25,
  },
  {
    slug: 'quebec',
    name: 'Quebec City',
    province: 'Quebec',
    lat: 46.8139,
    lng: -71.208,
    radiusKm: 18,
    aliases: ['Quebec', 'Québec', 'Québec City'],
  },
  {
    slug: 'winnipeg',
    name: 'Winnipeg',
    province: 'Manitoba',
    lat: 49.8954,
    lng: -97.1385,
    radiusKm: 20,
  },
  {
    slug: 'hamilton',
    name: 'Hamilton',
    province: 'Ontario',
    lat: 43.2557,
    lng: -79.8711,
    radiusKm: 18,
  },
  {
    slug: 'kitchener',
    name: 'Kitchener',
    province: 'Ontario',
    lat: 43.4516,
    lng: -80.4925,
    radiusKm: 22,
    aliases: ['Kitchener-Waterloo', 'Kitchener–Waterloo'],
  },
  {
    slug: 'london',
    name: 'London',
    province: 'Ontario',
    lat: 42.9849,
    lng: -81.2453,
    radiusKm: 18,
  },
  {
    slug: 'halifax',
    name: 'Halifax',
    province: 'Nova Scotia',
    lat: 44.6488,
    lng: -63.5752,
    radiusKm: 18,
  },
  {
    slug: 'st-catharines',
    name: 'St. Catharines',
    province: 'Ontario',
    lat: 43.1594,
    lng: -79.2469,
    radiusKm: 30,
    aliases: [
      'St. Catharines-Niagara',
      'St. Catharines–Niagara',
      'St Catharines',
      'Saint Catharines',
    ],
  },
  {
    slug: 'windsor',
    name: 'Windsor',
    province: 'Ontario',
    lat: 42.3149,
    lng: -83.0364,
    radiusKm: 16,
  },
  {
    slug: 'oshawa',
    name: 'Oshawa',
    province: 'Ontario',
    lat: 43.8971,
    lng: -78.8658,
    radiusKm: 14,
  },
  {
    slug: 'victoria',
    name: 'Victoria',
    province: 'British Columbia',
    lat: 48.4284,
    lng: -123.3656,
    radiusKm: 14,
  },
  {
    slug: 'saskatoon',
    name: 'Saskatoon',
    province: 'Saskatchewan',
    lat: 52.1332,
    lng: -106.67,
    radiusKm: 16,
  },
  {
    slug: 'regina',
    name: 'Regina',
    province: 'Saskatchewan',
    lat: 50.4452,
    lng: -104.6189,
    radiusKm: 16,
  },
  {
    slug: 'sherbrooke',
    name: 'Sherbrooke',
    province: 'Quebec',
    lat: 45.4042,
    lng: -71.8929,
    radiusKm: 14,
  },
  {
    slug: 'kelowna',
    name: 'Kelowna',
    province: 'British Columbia',
    lat: 49.888,
    lng: -119.496,
    radiusKm: 16,
  },
  {
    slug: 'mississauga',
    name: 'Mississauga',
    province: 'Ontario',
    lat: 43.589,
    lng: -79.6441,
    radiusKm: 14,
  },
] as const;

/** Province sections in the picker, largest markets first. */
export const CITY_PROVINCE_ORDER = [
  'Ontario',
  'Quebec',
  'British Columbia',
  'Alberta',
  'Manitoba',
  'Nova Scotia',
  'Saskatchewan',
] as const;

export type CityOption = {
  label: string;
  value: string | null;
  group?: string;
};

function lookupKeys(city: ProductCity): string[] {
  return [city.slug, city.name, ...(city.aliases ?? [])].map((item) =>
    item.toLowerCase(),
  );
}

export function findProductCity(
  value: string | null | undefined,
): ProductCity | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  return (
    PRODUCT_CITIES.find((city) => lookupKeys(city).includes(key)) ?? null
  );
}

/** Prefer the cities-endpoint string so filters match the backend exactly. */
export function productCityQueryValue(
  city: ProductCity,
  apiCities: readonly { city: string }[] = [],
): string {
  const keys = new Set(lookupKeys(city));
  const match = apiCities.find((item) =>
    keys.has(item.city.trim().toLowerCase()),
  );
  return match?.city ?? city.name;
}

export function buildCityOptions(
  apiCities: readonly { city: string }[] = [],
  options?: { includeAny?: boolean },
): CityOption[] {
  const includeAny = options?.includeAny ?? true;
  const provinceRank = (province: string) => {
    const index = (CITY_PROVINCE_ORDER as readonly string[]).indexOf(province);
    return index === -1 ? CITY_PROVINCE_ORDER.length : index;
  };
  const ranked = PRODUCT_CITIES.map((city, index) => ({ city, index })).sort(
    (a, b) => {
      const provinceDelta =
        provinceRank(a.city.province) - provinceRank(b.city.province);
      if (provinceDelta !== 0) return provinceDelta;
      return a.index - b.index;
    },
  );

  const rows: CityOption[] = ranked.map(({ city }) => ({
    label: city.name,
    value: productCityQueryValue(city, apiCities),
    group: city.province,
  }));

  return includeAny ? [{ label: 'Any', value: null }, ...rows] : rows;
}
