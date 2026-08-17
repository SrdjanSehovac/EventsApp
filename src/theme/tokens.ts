/**
 * Single source of truth for visual design tokens.
 * Adjust colors, spacing, type, and tab metrics here — both modes update together.
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
  xl: 24,
  full: 9999,
} as const;

const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  tabLabel: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
} as const;

const tabBarMetrics = {
  height: 56,
  fabSize: 64,
  fabProtrusion: 28,
  iconSize: 24,
  fabIconSize: 28,
} as const;

const shadows = {
  fab: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

const lightColors: ThemeColors = {
  primary: '#0F766E',
  primaryMuted: '#CCFBF1',
  onPrimary: '#FFFFFF',
  accent: '#F5B800',
  onAccent: '#1A1A1A',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  hairline: '#E2E8F0',
  tabBar: '#FFFFFF',
  tabInactive: '#64748B',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  overlay: 'rgba(15, 23, 42, 0.4)',
};

const darkColors: ThemeColors = {
  primary: '#2DD4BF',
  primaryMuted: '#134E4A',
  onPrimary: '#042F2E',
  accent: '#FBBF24',
  onAccent: '#1A1A1A',
  background: '#0B1220',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  border: '#334155',
  hairline: '#1E293B',
  tabBar: '#111827',
  tabInactive: '#94A3B8',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.55)',
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
