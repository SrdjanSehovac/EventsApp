import { isPrivateOrLocalHost, resolveApiBaseUrl } from './apiBase';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

check('dev without env uses localhost', resolveApiBaseUrl({ dev: true, platform: 'ios' }), {
  url: 'http://localhost:8000',
  misconfigured: false,
});

check(
  'dev android uses the emulator host',
  resolveApiBaseUrl({ dev: true, platform: 'android' }),
  { url: 'http://10.0.2.2:8000', misconfigured: false },
);

check(
  'dev can point at a LAN address',
  resolveApiBaseUrl({ dev: true, envUrl: 'http://192.168.1.10:8000' }),
  { url: 'http://192.168.1.10:8000', misconfigured: false },
);

check(
  'dev uses the Metro host when it is not localhost',
  resolveApiBaseUrl({ dev: true, hostUri: '192.168.1.20:8081', platform: 'ios' }),
  { url: 'http://192.168.1.20:8000', misconfigured: false },
);

check(
  'release without a URL does not fall back to localhost',
  resolveApiBaseUrl({ dev: false, platform: 'ios' }),
  { url: '', misconfigured: true },
);

check(
  'release ignores a Metro LAN host',
  resolveApiBaseUrl({
    dev: false,
    hostUri: '192.168.1.20:8081',
    platform: 'ios',
  }),
  { url: '', misconfigured: true },
);

check(
  'release rejects localhost',
  resolveApiBaseUrl({ dev: false, envUrl: 'http://localhost:8000' }),
  { url: '', misconfigured: true },
);

check(
  'release rejects the android emulator host',
  resolveApiBaseUrl({
    dev: false,
    envUrl: 'http://10.0.2.2:8000',
    platform: 'android',
  }),
  { url: '', misconfigured: true },
);

check(
  'release rejects a public http URL',
  resolveApiBaseUrl({ dev: false, envUrl: 'http://api.example.com' }),
  { url: '', misconfigured: true },
);

check(
  'release rejects a LAN URL',
  resolveApiBaseUrl({ dev: false, envUrl: 'http://192.168.1.10:8000' }),
  { url: '', misconfigured: true },
);

check(
  'release accepts a public https URL',
  resolveApiBaseUrl({ dev: false, envUrl: 'https://api.example.com/' }),
  { url: 'https://api.example.com', misconfigured: false },
);

check('localhost is private', isPrivateOrLocalHost('localhost'), true);
check('a public host is not private', isPrivateOrLocalHost('api.example.com'), false);
