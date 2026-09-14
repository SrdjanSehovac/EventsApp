import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import type { UserGeo } from '../types/common';

const GEO_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Ask for foreground location when possible.
 * Returns coords when granted + available; otherwise null so the API
 * keeps its default (non-localized) behavior.
 */
async function resolveUserGeo(): Promise<UserGeo | null> {
  try {
    // Browser/IP geolocation on the demo box often lands outside Ontario
    // (e.g. Chicago). Prefer the Toronto default map center on web.
    if (Platform.OS === 'web') return null;

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return null;

    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const position = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      GEO_TIMEOUT_MS,
    );
    if (!position) return null;

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    // Permission denied, services off, or platform unsupported — stay unlocalized.
    return null;
  }
}

export function useUserGeo() {
  return useQuery({
    queryKey: ['user-geo'],
    queryFn: resolveUserGeo,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
