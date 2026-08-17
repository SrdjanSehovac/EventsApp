import { useWindowDimensions } from 'react-native';

import {
  getBreakpoint,
  getContentMaxWidth,
  getHorizontalPadding,
  type BreakpointName,
} from './breakpoints';

export type ResponsiveValue = {
  width: number;
  height: number;
  breakpoint: BreakpointName;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  contentMaxWidth: number | undefined;
  horizontalPadding: number;
};

export function useResponsive(): ResponsiveValue {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);

  return {
    width,
    height,
    breakpoint,
    isPhone: breakpoint === 'phone',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    contentMaxWidth: getContentMaxWidth(breakpoint),
    horizontalPadding: getHorizontalPadding(breakpoint),
  };
}
