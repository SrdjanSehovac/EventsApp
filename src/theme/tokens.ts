/**
 * Single source of truth for visual design tokens.
 * EventsApp chrome: near-white / soft gray surfaces, charcoal-indigo actions.
 * Category hues stay on pins and event icons only — not the global chrome.
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
  title: { fontSize: 26, fontWeight: '800' as const, lineHeight: 32 },
  heading: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
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
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

const lightColors: ThemeColors = {
  primary: '#24356D',
  primaryMuted: '#E8EBF3',
  onPrimary: '#FFFFFF',
  accent: '#3A4A86',
  onAccent: '#FFFFFF',
  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF0F4',
  text: '#111827',
  textSecondary: '#3F4B5B',
  textMuted: '#6B7280',
  border: '#E2E5EB',
  hairline: '#ECEEF2',
  tabBar: '#FFFFFF',
  tabInactive: '#6B7280',
  success: '#0F9F6E',
  warning: '#D97706',
  danger: '#DC2626',
  overlay: 'rgba(17, 24, 39, 0.45)',
  pinStroke: '#FFFFFF',
  pinOutline: '#111827',
};

const darkColors: ThemeColors = {
  primary: '#9AA6D9',
  primaryMuted: '#252A40',
  onPrimary: '#0F1218',
  accent: '#B4BDE6',
  onAccent: '#0F1218',
  background: '#0F1218',
  surface: '#171B24',
  surfaceElevated: '#1E2430',
  text: '#F3F4F6',
  textSecondary: '#C5CAD3',
  textMuted: '#8B93A4',
  border: '#2A3140',
  hairline: '#222836',
  tabBar: '#12161E',
  tabInactive: '#8B93A4',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.58)',
  pinStroke: '#FFFFFF',
  pinOutline: '#0F1218',
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
