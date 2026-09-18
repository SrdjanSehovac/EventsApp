/**
 * In-memory auth token used by the API client.
 * AuthProvider is the only writer; keep this module free of React/API imports
 * so `client.ts` can read the token without circular dependencies.
 */
let authToken: string | null = null;
const unauthorizedListeners = new Set<() => void>();

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function subscribeUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function notifyUnauthorized(): void {
  authToken = null;
  for (const listener of unauthorizedListeners) {
    listener();
  }
}
