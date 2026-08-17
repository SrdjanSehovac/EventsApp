export const breakpoints = {
  phone: 600,
  tablet: 1024,
} as const;

export type BreakpointName = 'phone' | 'tablet' | 'desktop';

export function getBreakpoint(width: number): BreakpointName {
  if (width < breakpoints.phone) return 'phone';
  if (width < breakpoints.tablet) return 'tablet';
  return 'desktop';
}

export function getContentMaxWidth(breakpoint: BreakpointName): number | undefined {
  switch (breakpoint) {
    case 'phone':
      return undefined;
    case 'tablet':
      return 720;
    case 'desktop':
      return 960;
  }
}

export function getHorizontalPadding(breakpoint: BreakpointName): number {
  switch (breakpoint) {
    case 'phone':
      return 16;
    case 'tablet':
      return 24;
    case 'desktop':
      return 32;
  }
}
