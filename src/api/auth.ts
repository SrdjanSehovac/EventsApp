import { apiRequest } from './client';
import type {
  AuthSessionResponse,
  AuthUser,
  RawAuthUser,
  SignInInput,
  SignUpInput,
} from '../types/auth';

/**
 * EventServer auth contract (expected under `/v1`):
 *   POST /auth/signup  { email, password, display_name }
 *   POST /auth/login   { email, password }
 *   GET  /auth/me
 *   POST /auth/logout
 *
 * TODO: If EventServer ships OAuth2PasswordRequestForm instead of JSON login,
 * switch `/auth/login` to `application/x-www-form-urlencoded` with
 * `username` + `password`. Cookie-only sessions would also need
 * `credentials: 'include'` plus CORS allow-credentials on the server.
 *
 * Token: `{ access_token }` (FastAPI-style). The client sends Bearer when a
 * token is present.
 */
function readToken(payload: AuthSessionResponse | AuthUser): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as AuthSessionResponse;
  const token = record.access_token ?? record.accessToken ?? record.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

export function normalizeUser(
  raw: unknown,
  fallback?: { email?: string; display_name?: string },
): AuthUser {
  const data = (raw ?? {}) as RawAuthUser;
  const email = data.email ?? fallback?.email ?? '';
  const displayName =
    data.display_name ??
    data.displayName ??
    data.name ??
    fallback?.display_name ??
    email;
  const id = data.user_id ?? data.id ?? data.uuid ?? email;

  return {
    user_id: String(id),
    email,
    display_name: displayName,
    home_lat: data.home_lat ?? data.homeLat ?? null,
    home_lng: data.home_lng ?? data.homeLng ?? null,
  };
}

function sessionFrom(payload: AuthSessionResponse, fallback?: SignUpInput | SignInInput) {
  const token = readToken(payload);
  const userRaw = payload.user ?? (payload as unknown as RawAuthUser);
  const looksLikeUser =
    userRaw &&
    typeof userRaw === 'object' &&
    ('email' in userRaw ||
      'display_name' in userRaw ||
      'user_id' in userRaw ||
      'id' in userRaw);

  return {
    token,
    user: looksLikeUser
      ? normalizeUser(userRaw, fallback)
      : fallback?.email
        ? normalizeUser(null, fallback)
        : null,
  };
}

export async function signUpRequest(input: SignUpInput) {
  const payload = await apiRequest<AuthSessionResponse>({
    path: '/auth/signup',
    method: 'POST',
    body: {
      email: input.email.trim(),
      password: input.password,
      display_name: input.display_name.trim(),
    },
    auth: false,
  });
  return sessionFrom(payload, input);
}

export async function signInRequest(input: SignInInput) {
  const payload = await apiRequest<AuthSessionResponse>({
    path: '/auth/login',
    method: 'POST',
    body: {
      email: input.email.trim(),
      password: input.password,
    },
    auth: false,
  });
  return sessionFrom(payload, input);
}

export async function fetchCurrentUser(signal?: AbortSignal) {
  const payload = await apiRequest<unknown>({
    path: '/auth/me',
    signal,
  });
  return normalizeUser(payload);
}

export async function signOutRequest() {
  try {
    await apiRequest<void>({
      path: '/auth/logout',
      method: 'POST',
    });
  } catch {
    // Local sign-out still proceeds if EventServer has no logout route.
  }
}
