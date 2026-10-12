import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { resolveApiBaseUrl } from './apiBase';

/**
 * Development may use EXPO_PUBLIC_API_URL or the Metro host.
 * A release build only uses a public https EXPO_PUBLIC_API_URL.
 */
const resolvedApi = resolveApiBaseUrl({
  envUrl: process.env.EXPO_PUBLIC_API_URL,
  dev: typeof __DEV__ === 'undefined' ? true : __DEV__,
  hostUri: Constants.expoConfig?.hostUri,
  platform: Platform.OS,
});

export const API_BASE_URL = resolvedApi.url;
export const API_MISCONFIGURED = resolvedApi.misconfigured;
export const API_V1_URL = API_BASE_URL ? `${API_BASE_URL}/v1` : '';
