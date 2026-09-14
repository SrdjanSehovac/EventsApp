import { Platform } from 'react-native';

import type { AuthUser } from '../types/auth';

const TOKEN_KEY = 'eventsapp.auth.token';
const USER_KEY = 'eventsapp.auth.user';

async function nativeStore() {
  return import('expo-secure-store');
}

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }

  try {
    const SecureStore = await nativeStore();
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (token) globalThis.localStorage?.setItem(TOKEN_KEY, token);
      else globalThis.localStorage?.removeItem(TOKEN_KEY);
    } catch {
      // private mode / disabled storage
    }
    return;
  }

  const SecureStore = await nativeStore();
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  let raw: string | null = null;

  if (Platform.OS === 'web') {
    try {
      raw = globalThis.localStorage?.getItem(USER_KEY) ?? null;
    } catch {
      raw = null;
    }
  } else {
    try {
      const SecureStore = await nativeStore();
      raw = await SecureStore.getItemAsync(USER_KEY);
    } catch {
      raw = null;
    }
  }

  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: AuthUser | null): Promise<void> {
  const value = user ? JSON.stringify(user) : null;

  if (Platform.OS === 'web') {
    try {
      if (value) globalThis.localStorage?.setItem(USER_KEY, value);
      else globalThis.localStorage?.removeItem(USER_KEY);
    } catch {
      // private mode / disabled storage
    }
    return;
  }

  const SecureStore = await nativeStore();
  if (value) await SecureStore.setItemAsync(USER_KEY, value);
  else await SecureStore.deleteItemAsync(USER_KEY);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([setStoredToken(null), setStoredUser(null)]);
}
