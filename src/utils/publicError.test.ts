import { friendlyPublicError } from './publicError';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

const fallback = "Can't load events right now. Check your connection and try again.";

check(
  'network failure stays friendly',
  friendlyPublicError(new Error('Network request failed'), fallback),
  fallback,
);

check(
  'a route hint stays friendly',
  friendlyPublicError(
    Object.assign(new Error('EventServer needs GET /v1/me/favourites'), { status: 404 }),
    fallback,
  ),
  fallback,
);

check(
  'Request failed (500) stays friendly',
  friendlyPublicError(Object.assign(new Error('Request failed (500)'), { status: 500 }), fallback),
  fallback,
);

check(
  'a human server sentence is shown',
  friendlyPublicError(new Error('That email is already registered.'), fallback),
  'That email is already registered.',
);

check(
  'an empty error uses the fallback',
  friendlyPublicError(null, fallback),
  fallback,
);
