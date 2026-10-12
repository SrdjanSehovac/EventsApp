import { PRODUCT_CITIES } from '../config/cities';
import { NEIGHBOURHOODS } from '../config/neighbourhoods';
import { regionForZoom } from './mapRegion';
import { searchPlaces } from './placeSearch';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

function kmBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const radius = 6371;
  const radians = Math.PI / 180;
  const dLat = (lat2 - lat1) * radians;
  const dLng = (lng2 - lng1) * radians;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * radians) * Math.cos(lat2 * radians) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(a));
}

check(
  'blank query suggests nothing',
  searchPlaces('   '),
  { cities: [], neighbourhoods: [] },
);

const montreal = searchPlaces('montreal');
check('montreal ignores the missing accent', montreal.cities[0]?.title, 'Montreal');
check('Montréal with an accent is the same city', searchPlaces('Montréal').cities[0]?.citySlug, 'montreal');

const quebec = searchPlaces('Québec');
check('Québec matches Quebec City', quebec.cities[0]?.title, 'Quebec City');
check('quebec without an accent matches Quebec City', searchPlaces('quebec').cities[0]?.title, 'Quebec City');

check('a swapped-letter typo still finds Toronto', searchPlaces('toronot').cities[0]?.title, 'Toronto');
check(
  'a short prefix does not match letters buried in another name',
  searchPlaces('tor').cities.some((place) => place.title === 'Victoria'),
  false,
);
check('a missing letter still finds Montreal', searchPlaces('montral').cities[0]?.title, 'Montreal');

const york = searchPlaces('york');
check('york finds Yorkville', york.neighbourhoods[0]?.title, 'Yorkville');
check('Yorkville stays in Toronto', york.neighbourhoods[0]?.citySlug, 'toronto');

check(
  'old east finds Old East Village',
  searchPlaces('old east').neighbourhoods[0]?.title,
  'Old East Village',
);

check(
  'kensington typo finds Kensington Market',
  searchPlaces('kensignton').neighbourhoods.some((place) => place.title === 'Kensington Market'),
  true,
);

check('gibberish matches no place', searchPlaces('zzzzqqq').cities.length, 0);
check('gibberish matches no neighbourhood', searchPlaces('zzzzqqq').neighbourhoods.length, 0);

const downtown = searchPlaces('downtown', { citySlug: 'london' });
check(
  'the city on screen ranks its own downtown first',
  downtown.neighbourhoods[0]?.key,
  'neighbourhood:london:downtown',
);

check(
  'toronto query offers Toronto neighbourhoods',
  searchPlaces('Toronto').neighbourhoods.some((place) => place.citySlug === 'toronto'),
  true,
);

check(
  'a single letter does not match every city that contains it',
  searchPlaces('a').cities.some((place) => place.title === 'Calgary'),
  false,
);

for (const city of PRODUCT_CITIES) {
  const places = NEIGHBOURHOODS.filter((place) => place.citySlug === city.slug);
  check(`${city.slug} has neighbourhoods`, places.length >= 4, true);
  for (const place of places) {
    const distance = kmBetween(city.lat, city.lng, place.lat, place.lng);
    check(
      `${place.name} is near ${city.name}`,
      distance < city.radiusKm + 12,
      true,
    );
    check(
      `${place.name} zoom is a neighbourhood camera`,
      place.zoom >= 12 && place.zoom <= 16,
      true,
    );
  }
}

const named = [
  'Downtown',
  'Yorkville',
  'Kensington Market',
  'Queen West',
  'Distillery District',
  'Leslieville',
  'The Annex',
  'Liberty Village',
  'North York',
  'Scarborough',
  'Etobicoke',
];
for (const name of named) {
  check(
    `Toronto includes ${name}`,
    NEIGHBOURHOODS.some((place) => place.citySlug === 'toronto' && place.name === name),
    true,
  );
}

for (const name of ['Downtown', 'Old East Village', 'Wortley Village', 'Masonville', 'Byron']) {
  check(
    `London includes ${name}`,
    NEIGHBOURHOODS.some((place) => place.citySlug === 'london' && place.name === name),
    true,
  );
}

const tight = regionForZoom(43.65, -79.38, 14);
const wide = regionForZoom(43.65, -79.38, 12);
check('a closer zoom is a smaller region', tight.latitudeDelta < wide.latitudeDelta, true);
