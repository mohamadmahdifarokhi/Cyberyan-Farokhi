import { Platform } from 'react-native';

export function getPlatformFont(): string {
  if (Platform.OS === 'ios') {
    return 'System';
  } else if (Platform.OS === 'android') {
    return 'Roboto';
  } else {
    return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  }
}

export const typography = {
  fontFamily: {
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Menlo, Monaco, "Courier New", monospace',
    }) as string,
    regular: getPlatformFont(),
    medium: getPlatformFont(),
    bold: getPlatformFont(),
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2.0,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export type Typography = typeof typography;
