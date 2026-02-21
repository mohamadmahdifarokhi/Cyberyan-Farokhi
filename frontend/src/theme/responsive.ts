import { Dimensions } from 'react-native';
import { spacing as baseSpacing } from './spacing';

export const breakpoints = {
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
};
export const MIN_TOUCH_TARGET = 44;

export type ScreenSize = 'sm' | 'md' | 'lg' | 'xl';

export function getScreenSize(width: number): ScreenSize {
  if (width < breakpoints.sm) {
    return 'sm';
  } else if (width < breakpoints.md) {
    return 'sm';
  } else if (width < breakpoints.lg) {
    return 'md';
  } else if (width < breakpoints.xl) {
    return 'lg';
  } else {
    return 'xl';
  }
}

export const responsiveSpacing = {
  sm: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
  },
  md: baseSpacing,
  lg: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 52,
  },
  xl: {
    xs: 8,
    sm: 12,
    md: 20,
    lg: 28,
    xl: 36,
    '2xl': 48,
    '3xl': 64,
  },
};

export function getResponsiveSpacing(screenSize: ScreenSize) {
  return responsiveSpacing[screenSize];
}

export const fontSizeMultipliers = {
  sm: 0.9,
  md: 1.0,
  lg: 1.1,
  xl: 1.15,
};

export function getResponsiveFontSize(baseSize: number, screenSize: ScreenSize): number {
  return Math.round(baseSize * fontSizeMultipliers[screenSize]);
}

export function getScreenDimensions() {
  const { width, height } = Dimensions.get('window');

  return { width, height };
}

export function isSmallScreen(): boolean {
  const { width } = getScreenDimensions();

  return width < breakpoints.md;
}

export function isMediumScreen(): boolean {
  const { width } = getScreenDimensions();

  return width >= breakpoints.md && width < breakpoints.lg;
}

export function isLargeScreen(): boolean {
  const { width } = getScreenDimensions();

  return width >= breakpoints.lg;
}

export function ensureTouchTarget(size: number): number {
  return Math.max(size, MIN_TOUCH_TARGET);
}
