import { Platform } from 'react-native';

import type { SubmittedEvent } from '../types/submissions';

function keyFor(userId: string) {
  return `eventsapp.submissions.${userId}`;
}

async function nativeStore() {
  return import('expo-secure-store');
}

export async function getLocalSubmissions(userId: string): Promise<SubmittedEvent[]> {
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

  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SubmittedEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setLocalSubmissions(
  userId: string,
  items: SubmittedEvent[],
): Promise<void> {
  const value = JSON.stringify(items);

  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(keyFor(userId), value);
    } catch {
      // private mode / disabled storage
    }
    return;
  }

  const SecureStore = await nativeStore();
  await SecureStore.setItemAsync(keyFor(userId), value);
}

export async function appendLocalSubmission(
  userId: string,
  item: SubmittedEvent,
): Promise<SubmittedEvent[]> {
  const items = await getLocalSubmissions(userId);
  const next = [item, ...items.filter((entry) => entry.submission_id !== item.submission_id)];
  await setLocalSubmissions(userId, next);
  return next;
}
