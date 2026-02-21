import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';
import { animations } from './animations';

export const createTheme = (isDark: boolean) => ({
  colors: isDark ? darkColors : lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  isDark,
});

export const theme = createTheme(false);
export type Theme = ReturnType<typeof createTheme>;

export { lightColors, darkColors, colors } from './colors';
export { typography, getPlatformFont } from './typography';
export { spacing, borderRadius, shadows } from './spacing';
export { animations } from './animations';
export {
  breakpoints,
  responsiveSpacing,
  getScreenSize,
  getResponsiveSpacing,
  getResponsiveFontSize,
  MIN_TOUCH_TARGET,
  ensureTouchTarget,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  type ScreenSize,
} from './responsive';
