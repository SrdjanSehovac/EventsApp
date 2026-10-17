import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { isDaytime } from './sun';
import { getTokens, type ColorSchemeName, type ThemeTokens } from './tokens';

/**
 * auto: light from local sunrise to sunset (7:00–19:00 without location).
 * system: follow the iPhone's Light/Dark setting.
 */
export type ThemeMode = 'auto' | 'light' | 'dark' | 'system';

export const THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark', 'system'];
const STORAGE_KEY = 'eventsapp.prefs.appearance';
const RECHECK_MS = 60_000;

export type ThemeContextValue = ThemeTokens & {
  mode: ThemeMode;
  resolvedScheme: ColorSchemeName;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  initialMode?: ThemeMode;
};

/** Last known position, only when location is already allowed. Never prompts. */
async function quietPlace(): Promise<{ lat: number; lng: number } | null> {
  if (Platform.OS === 'web') return null;
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos = await Location.getLastKnownPositionAsync();
    return pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children, initialMode = 'auto' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [place, setPlace] = useState<{ lat: number; lng: number } | null>(null);
  const [daytime, setDaytime] = useState(() => isDaytime(new Date(), null));

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw && (THEME_MODES as string[]).includes(raw)) setModeState(raw as ThemeMode);
      })
      .catch(() => undefined);
  }, []);

  // Auto: re-evaluate on a timer and whenever the app comes to the foreground.
  useEffect(() => {
    if (mode !== 'auto') return;
    let live = true;
    const evaluate = async () => {
      const where = (await quietPlace()) ?? place;
      if (!live) return;
      if (where && where !== place) setPlace(where);
      setDaytime(isDaytime(new Date(), where));
    };
    void evaluate();
    const timer = setInterval(() => void evaluate(), RECHECK_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void evaluate();
    });
    return () => {
      live = false;
      clearInterval(timer);
      sub.remove();
    };
    // place is read as a fallback only; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const resolvedScheme: ColorSchemeName =
    mode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode === 'auto'
        ? daytime
          ? 'light'
          : 'dark'
        : mode;

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const tokens = getTokens(resolvedScheme);
    return {
      ...tokens,
      mode,
      resolvedScheme,
      setMode,
      isDark: resolvedScheme === 'dark',
    };
  }, [resolvedScheme, mode, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
