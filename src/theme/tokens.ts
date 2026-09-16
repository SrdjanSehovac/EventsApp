/**
 * Single source of truth for visual design tokens.
 * EventsApp brand: warm cream surfaces, coral primary, apricot accent.
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
    shadowColor: '#3B1F14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#3B1F14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    shadowColor: '#3B1F14',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

const lightColors: ThemeColors = {
  primary: '#E23E57',
  primaryMuted: '#FFE0E4',
  onPrimary: '#FFFFFF',
  accent: '#F4A261',
  onAccent: '#2B1D16',
  background: '#FFF6EE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFF1E4',
  text: '#2B1D16',
  textSecondary: '#6B4E3D',
  textMuted: '#A07C66',
  border: '#F0DCC8',
  hairline: '#F3E2D2',
  tabBar: '#FFFBF7',
  tabInactive: '#9A7B68',
  success: '#0F9F6E',
  warning: '#D97706',
  danger: '#DC2626',
  overlay: 'rgba(43, 29, 22, 0.42)',
  pinStroke: '#FFFFFF',
  pinOutline: '#2B1D16',
};

const darkColors: ThemeColors = {
  primary: '#FF6B81',
  primaryMuted: '#4A1F28',
  onPrimary: '#2B1014',
  accent: '#F4A261',
  onAccent: '#2B1D16',
  background: '#16100C',
  surface: '#231812',
  surfaceElevated: '#2F2118',
  text: '#FFF4EA',
  textSecondary: '#D9B9A4',
  textMuted: '#A07C66',
  border: '#3D2A20',
  hairline: '#2C1D16',
  tabBar: '#1C1410',
  tabInactive: '#B08C76',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.58)',
  pinStroke: '#FFFFFF',
  pinOutline: '#1A120C',
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
