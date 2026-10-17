import {
  CITY_PROVINCE_ORDER,
  PRODUCT_CITIES,
  buildCityOptions,
  findProductCity,
  productCityQueryValue,
} from './cities';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

check('twenty-one product cities', PRODUCT_CITIES.length, 21);

const slugs = PRODUCT_CITIES.map((city) => city.slug);
check('unique slugs', new Set(slugs).size, 21);
check('unique display names', new Set(PRODUCT_CITIES.map((city) => city.name)).size, 21);

const expectedSlugs = [
  'toronto',
  'montreal',
  'vancouver',
  'ottawa',
  'calgary',
  'edmonton',
  'quebec',
  'winnipeg',
  'hamilton',
  'kitchener',
  'london',
  'halifax',
  'st-catharines',
  'windsor',
  'oshawa',
  'victoria',
  'saskatoon',
  'regina',
  'sherbrooke',
  'kelowna',
  'mississauga',
];
check('registry slug order', slugs, expectedSlugs);

for (const city of PRODUCT_CITIES) {
  check(`${city.slug} centre is in Canada`, city.lat > 41 && city.lat < 70 && city.lng < -52 && city.lng > -141, true);
  check(`${city.slug} radius is a city view`, city.radiusKm >= 10 && city.radiusKm <= 40, true);
  check(`${city.name} is a plain name`, city.name.startsWith('City '), false);
  check(`${city.slug} resolves by slug`, findProductCity(city.slug)?.slug, city.slug);
  check(`${city.slug} resolves by display name`, findProductCity(city.name)?.slug, city.slug);
}

const toronto = findProductCity('toronto');
check(
  'toronto keeps the default camera',
  [toronto?.lat, toronto?.lng],
  [43.6532, -79.3832],
);

check('Quebec City', findProductCity('Quebec City')?.slug, 'quebec');
check('Quebec alias', findProductCity('Québec')?.slug, 'quebec');
check('Kitchener short name', findProductCity('Kitchener')?.name, 'Kitchener');
check(
  'Kitchener-Waterloo metro alias',
  findProductCity('Kitchener-Waterloo')?.slug,
  'kitchener',
);
check('St. Catharines', findProductCity('St. Catharines')?.slug, 'st-catharines');
check(
  'St. Catharines-Niagara metro alias',
  findProductCity('St. Catharines-Niagara')?.slug,
  'st-catharines',
);
check('empty city is not a match', findProductCity('  '), null);
check('unknown city is not a match', findProductCity('Brampton'), null);

const kitchener = findProductCity('kitchener');
check(
  'query value prefers the API display name',
  productCityQueryValue(kitchener!, [{ city: 'Kitchener-Waterloo' }]),
  'Kitchener-Waterloo',
);
check(
  'query value falls back to the plain name',
  productCityQueryValue(kitchener!, []),
  'Kitchener',
);

const options = buildCityOptions([
  { city: 'Ottawa' },
  { city: 'Quebec City' },
  { city: 'Kitchener' },
  { city: 'St. Catharines' },
]);
check('picker starts with Any', options[0], { label: 'Any', value: null });
check('picker offers every city', options.length, 22);
check(
  'picker labels stay plain',
  options.map((option) => option.label),
  [
    'Any',
    'Toronto',
    'Ottawa',
    'Hamilton',
    'Kitchener',
    'London',
    'St. Catharines',
    'Windsor',
    'Oshawa',
    'Mississauga',
    'Montreal',
    'Quebec City',
    'Sherbrooke',
    'Vancouver',
    'Victoria',
    'Kelowna',
    'Calgary',
    'Edmonton',
    'Winnipeg',
    'Halifax',
    'Saskatoon',
    'Regina',
  ],
);
check(
  'no City prefix on options',
  options.every((option) => !option.label.startsWith('City')),
  true,
);

const groups: string[] = [];
for (const option of options) {
  if (option.group && option.group !== groups[groups.length - 1]) {
    groups.push(option.group);
  }
}
check('provinces follow market order', groups, [...CITY_PROVINCE_ORDER]);

const required = buildCityOptions([], { includeAny: false });
check('required city picker has no Any', required.some((option) => option.value === null), false);
check('required city picker still has 21', required.length, 21);

console.log('all city checks passed');
