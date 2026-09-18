/**
 * Single source of truth for visual design tokens.
 * EventsApp chrome (scheme A — Emerald): near-white surfaces, warm-gray cards,
 * deep emerald actions (#0F766E). Category hues stay on pins and event icons only.
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
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

const lightColors: ThemeColors = {
  primary: '#0F766E',
  primaryMuted: '#E0F2F1',
  onPrimary: '#FFFFFF',
  accent: '#115E59',
  onAccent: '#FFFFFF',
  background: '#FAFAF8',
  surface: '#F1EFEC',
  surfaceElevated: '#E8E6E1',
  text: '#1C1917',
  textSecondary: '#44403C',
  textMuted: '#78716C',
  border: '#D4DBD4',
  hairline: '#E6EAE5',
  tabBar: '#FFFFFF',
  tabInactive: '#78716C',
  success: '#15803D',
  warning: '#D97706',
  danger: '#DC2626',
  overlay: 'rgba(28, 25, 23, 0.45)',
  pinStroke: '#FFFFFF',
  pinOutline: '#1C1917',
};

const darkColors: ThemeColors = {
  primary: '#2DD4BF',
  primaryMuted: '#134E4A',
  onPrimary: '#042F2E',
  accent: '#5EEAD4',
  onAccent: '#042F2E',
  background: '#0C1210',
  surface: '#151C19',
  surfaceElevated: '#1C2421',
  text: '#F5F5F4',
  textSecondary: '#D6D3D1',
  textMuted: '#A8A29E',
  border: '#2A3531',
  hairline: '#1F2925',
  tabBar: '#101714',
  tabInactive: '#A8A29E',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.58)',
  pinStroke: '#FFFFFF',
  pinOutline: '#0C1210',
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
