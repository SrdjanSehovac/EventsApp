import { Platform } from 'react-native';

import type { BusinessProfile } from '../types/business';

function keyFor(userId: string) {
  return `eventsapp.business.${userId}`;
}

async function nativeStore() {
  return import('expo-secure-store');
}

export async function getLocalBusiness(
  userId: string,
): Promise<BusinessProfile | null> {
  let raw: string | null = null;

  if (Platform.OS === 'web') {
    try {
      raw = globalThis.localStorage?.getItem(keyFor(userId)) ?? null;
    } catch {
      raw = null;
    }
  } else {
    try {
      const SecureStore = await nativeStore();
      raw = await SecureStore.getItemAsync(keyFor(userId));
    } catch {
      raw = null;
    }
  }

  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BusinessProfile;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function setLocalBusiness(
  userId: string,
  profile: BusinessProfile | null,
): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (profile) {
        globalThis.localStorage?.setItem(keyFor(userId), JSON.stringify(profile));
      } else {
        globalThis.localStorage?.removeItem(keyFor(userId));
      }
    } catch {
      // private mode / disabled storage
    }
    return;
  }

  const SecureStore = await nativeStore();
  if (profile) {
    await SecureStore.setItemAsync(keyFor(userId), JSON.stringify(profile));
  } else {
    await SecureStore.deleteItemAsync(keyFor(userId));
  }
}
