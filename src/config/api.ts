import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve the API host for Expo Go / simulators.
 * Override anytime with EXPO_PUBLIC_API_URL (e.g. http://192.168.1.10:8000).
 */
function resolveDevHost(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveDevHost();
export const API_V1_URL = `${API_BASE_URL}/v1`;
