import { largestImageUrl } from './imageUrl';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

const small = 'https://cdn.example/events/hero.jpg?w=480&h=320';
const large = 'https://cdn.example/events/hero.jpg?w=1600';
const original = 'https://cdn.example/events/hero.jpg';
const other = 'https://cdn.example/events/crowd.jpg?w=2000';

check(
  'a larger copy of the same file wins',
  largestImageUrl(small, [small, large]),
  large,
);

check(
  'an unsized original outranks a resized copy',
  largestImageUrl(small, [small, original, large]),
  original,
);

check(
  'a different photo is not substituted',
  largestImageUrl(small, [small, other]),
  small,
);

check(
  'the only url is kept, including its size query',
  largestImageUrl(small, [small]),
  small,
);
