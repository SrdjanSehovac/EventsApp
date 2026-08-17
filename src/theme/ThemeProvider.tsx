import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { getTokens, type ColorSchemeName, type ThemeTokens } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

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

export function ThemeProvider({
  children,
  initialMode = 'system',
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const resolvedScheme: ColorSchemeName =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const handleSetMode = useCallback((next: ThemeMode) => {
    setMode(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const tokens = getTokens(resolvedScheme);
    return {
      ...tokens,
      mode,
      resolvedScheme,
      setMode: handleSetMode,
      isDark: resolvedScheme === 'dark',
    };
  }, [resolvedScheme, mode, handleSetMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
