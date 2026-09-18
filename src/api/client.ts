import { API_V1_URL } from '../config/api';
import type { ApiErrorBody, UserGeo } from '../types/common';
import { getAuthToken, notifyUnauthorized } from './session';

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type QueryValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | null
  | undefined;

export type RequestOptions = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  geo?: UserGeo | null;
  signal?: AbortSignal;
  /** When false, skip the Bearer token (login / signup). Default true. */
  auth?: boolean;
};

function appendQuery(
  url: URL,
  query?: Record<string, QueryValue>,
): void {
  if (!query) return;

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      url.searchParams.set(key, value.map(String).join(','));
      continue;
    }
    url.searchParams.set(key, String(value));
  }
}

export async function apiRequest<T>({
  path,
  method = 'GET',
  query,
  body,
  geo,
  signal,
  auth = true,
}: RequestOptions): Promise<T> {
  const url = new URL(
    path.startsWith('http') ? path : `${API_V1_URL}${path}`,
  );
  appendQuery(url, query);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (geo) {
    headers['X-User-Lat'] = String(geo.lat);
    headers['X-User-Lng'] = String(geo.lng);
  }

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401 && auth) {
      notifyUnauthorized();
    }

    let parsed: ApiErrorBody | null = null;
    let message = `Request failed (${response.status})`;

    try {
      parsed = (await response.json()) as ApiErrorBody;
      if (typeof parsed.detail === 'string') {
        message = parsed.detail;
      } else if (Array.isArray(parsed.detail) && parsed.detail[0]?.msg) {
        message = parsed.detail[0].msg;
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new ApiError(response.status, message, parsed);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
