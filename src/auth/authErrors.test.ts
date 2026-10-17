import { friendlyAuthError } from './authErrors';

function check(name: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: ${actualJson} !== ${expectedJson}`);
  }
  console.log(`ok  ${name}`);
}

const signupDeveloper = new Error(
  'Sign-up is not available yet (EventServer needs POST /v1/auth/signup).',
);
const missingRoute = Object.assign(new Error('Not Found'), { status: 404 });

check(
  'signup developer copy is hidden',
  friendlyAuthError(signupDeveloper, 'sign-up'),
  "Sign-up isn't available right now. Please try again later.",
);

check(
  'signup 404 is hidden',
  friendlyAuthError(missingRoute, 'sign-up'),
  "Sign-up isn't available right now. Please try again later.",
);

check(
  'signup keeps a human server message',
  friendlyAuthError(new Error('An account with this email already exists.'), 'sign-up'),
  'An account with this email already exists.',
);

check(
  'signin route note is hidden',
  friendlyAuthError(
    new Error('Sign-in is not available yet (EventServer needs POST /v1/auth/login).'),
    'sign-in',
  ),
  "Sign-in isn't available right now. Please try again later.",
);

console.log('all auth error checks passed');
