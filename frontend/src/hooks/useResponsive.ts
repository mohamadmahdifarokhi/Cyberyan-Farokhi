import { useState, useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';
import {
  getScreenSize,
  getResponsiveSpacing,
  getResponsiveFontSize,
  MIN_TOUCH_TARGET,
  isSmallScreen as checkIsSmallScreen,
  isMediumScreen as checkIsMediumScreen,
  isLargeScreen as checkIsLargeScreen,
  type ScreenSize,
} from '../theme/responsive';
import { typography } from '../theme/typography';

export interface UseResponsiveReturn {
  screenSize: ScreenSize;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  spacing: ReturnType<typeof getResponsiveSpacing>;
  fontSize: (size: keyof typeof typography.fontSize) => number;
  touchTarget: number;
  width: number;
  height: number;
}

export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');

    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const responsiveValues = useMemo(() => {
    const { width, height } = dimensions;
    const screenSize = getScreenSize(width);
    const spacing = getResponsiveSpacing(screenSize);

    return {
      screenSize,
      isSmallScreen: checkIsSmallScreen(),
      isMediumScreen: checkIsMediumScreen(),
      isLargeScreen: checkIsLargeScreen(),
      spacing,
      fontSize: (size: keyof typeof typography.fontSize) => {
        const baseSize = typography.fontSize[size];

        return getResponsiveFontSize(baseSize, screenSize);
      },
      touchTarget: MIN_TOUCH_TARGET,
      width,
      height,
    };
  }, [dimensions]);

  return responsiveValues;
}
