import { parseImageFallback } from './imageFallback';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

check('null fallback is hidden', parseImageFallback(null), null);
check('blank fallback is hidden', parseImageFallback('  '), null);
check('unknown kind is hidden', parseImageFallback('logo:western'), null);

check(
  'western campus',
  parseImageFallback('campus:western'),
  { kind: 'campus', slug: 'western', name: 'Western University' },
);
check(
  'algonquin campus',
  parseImageFallback('campus:algonquin'),
  { kind: 'campus', slug: 'algonquin', name: 'Algonquin College' },
);
check(
  'uottawa campus',
  parseImageFallback('campus:uottawa'),
  { kind: 'campus', slug: 'uottawa', name: 'University of Ottawa' },
);
check(
  'carleton campus',
  parseImageFallback('CAMPUS:Carleton'),
  { kind: 'campus', slug: 'carleton', name: 'Carleton University' },
);
check(
  'durham campus',
  parseImageFallback('campus:durham'),
  { kind: 'campus', slug: 'durham', name: 'Durham College' },
);
check(
  'unknown campus slug stays readable',
  parseImageFallback('campus:st-clair'),
  { kind: 'campus', slug: 'st_clair', name: 'St. Clair' },
);

check(
  'music category',
  parseImageFallback('category:music'),
  { kind: 'category', slug: 'music', label: 'Music' },
);
check(
  'nightlife category',
  parseImageFallback('category:nightlife'),
  { kind: 'category', slug: 'nightlife', label: 'Nightlife' },
);
check(
  'leaf category uses the group label',
  parseImageFallback('category:jazz_blues'),
  { kind: 'category', slug: 'music', label: 'Music' },
);
check(
  'unknown category stays readable',
  parseImageFallback('category:campus-life'),
  { kind: 'category', slug: 'campus_life', label: 'Campus Life' },
);

console.log('all image fallback checks passed');
