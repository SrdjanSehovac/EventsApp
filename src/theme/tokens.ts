/**
 * Single source of truth for visual design tokens.
 * Light marketplace shell inspired by listing-map apps (teal accent, not a brand copy).
 */

export type ColorSchemeName = 'light' | 'dark';

export type ThemeColors = {
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  hairline: string;
  tabBar: string;
  tabInactive: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  pinStroke: string;
  pinOutline: string;
};

export type ThemeTokens = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  tabBar: typeof tabBarMetrics;
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32 },
  heading: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  tabLabel: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
} as const;

const tabBarMetrics = {
  height: 58,
  fabSize: 0,
  fabProtrusion: 0,
  iconSize: 22,
  fabIconSize: 22,
} as const;

const shadows = {
  fab: {
    shadowColor: '#08332E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#08332E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    shadowColor: '#08332E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

const lightColors: ThemeColors = {
  primary: '#0E8A7D',
  primaryMuted: '#D7F4EF',
  onPrimary: '#FFFFFF',
  accent: '#0B6E64',
  onAccent: '#FFFFFF',
  background: '#F3F7F6',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF6F4',
  text: '#12211F',
  textSecondary: '#3D5652',
  textMuted: '#6B817C',
  border: '#D5E5E1',
  hairline: '#E4EEEC',
  tabBar: '#FFFFFF',
  tabInactive: '#7A908C',
  success: '#0F9F6E',
  warning: '#D97706',
  danger: '#DC2626',
  overlay: 'rgba(18, 33, 31, 0.45)',
  pinStroke: '#FFFFFF',
  pinOutline: '#12211F',
};

const darkColors: ThemeColors = {
  primary: '#2DD4BF',
  primaryMuted: '#134E48',
  onPrimary: '#06201C',
  accent: '#5EEAD4',
  onAccent: '#06201C',
  background: '#0C1413',
  surface: '#16201E',
  surfaceElevated: '#1C2A27',
  text: '#F3FBFA',
  textSecondary: '#C5D9D5',
  textMuted: '#8AA39E',
  border: '#2A3C38',
  hairline: '#1E2C29',
  tabBar: '#101917',
  tabInactive: '#8AA39E',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.58)',
  pinStroke: '#FFFFFF',
  pinOutline: '#0C1413',
};

export const palettes: Record<ColorSchemeName, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

export function getTokens(scheme: ColorSchemeName): ThemeTokens {
  return {
    colors: palettes[scheme],
    spacing,
    radius,
    typography,
    shadows,
    tabBar: tabBarMetrics,
  };
}
