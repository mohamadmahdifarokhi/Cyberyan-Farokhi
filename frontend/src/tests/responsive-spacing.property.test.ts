import * as fc from 'fast-check';
import {
  breakpoints,
  getScreenSize,
  getResponsiveSpacing,
  getResponsiveFontSize,
  fontSizeMultipliers,
  responsiveSpacing,
  MIN_TOUCH_TARGET,
  ensureTouchTarget,
  type ScreenSize,
} from '../theme/responsive';

describe('Responsive Spacing Property Tests', () => {
  describe('Property 4: Responsive spacing adaptation', () => {
    it('should categorize screen sizes correctly based on width', () => {
      fc.assert(
        fc.property(fc.integer({ min: 200, max: 2000 }), (width) => {
          const size = getScreenSize(width);

          if (width < breakpoints.md) {
            return size === 'sm';
          } else if (width < breakpoints.lg) {
            return size === 'md';
          } else if (width < breakpoints.xl) {
            return size === 'lg';
          } else {
            return size === 'xl';
          }
        }),
        { numRuns: 100 },
      );
    });

    it('should return correct spacing scale for each screen size', () => {
      fc.assert(
        fc.property(fc.constantFrom<ScreenSize>('sm', 'md', 'lg', 'xl'), (screenSize) => {
          const spacing = getResponsiveSpacing(screenSize);
          const expected = responsiveSpacing[screenSize];

          return spacing === expected;
        }),
        { numRuns: 100 },
      );
    });

    it('should have compact spacing on small screens', () => {
      const smSpacing = responsiveSpacing.sm;
      const mdSpacing = responsiveSpacing.md;

      fc.assert(
        fc.property(fc.constantFrom('xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'), (key) => {
          const smValue = smSpacing[key as keyof typeof smSpacing];
          const mdValue = mdSpacing[key as keyof typeof mdSpacing];

          return smValue <= mdValue;
        }),
        { numRuns: 100 },
      );
    });

    it('should have expanded spacing on large screens', () => {
      const lgSpacing = responsiveSpacing.lg;
      const mdSpacing = responsiveSpacing.md;

      fc.assert(
        fc.property(fc.constantFrom('xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'), (key) => {
          const lgValue = lgSpacing[key as keyof typeof lgSpacing];
          const mdValue = mdSpacing[key as keyof typeof mdSpacing];

          return lgValue >= mdValue;
        }),
        { numRuns: 100 },
      );
    });

    it('should have positive spacing values for all screen sizes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ScreenSize>('sm', 'md', 'lg', 'xl'),
          fc.constantFrom('xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'),
          (screenSize, spacingKey) => {
            const spacing = responsiveSpacing[screenSize];
            const value = spacing[spacingKey as keyof typeof spacing];

            return typeof value === 'number' && value > 0;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should have monotonically increasing spacing values within each scale', () => {
      fc.assert(
        fc.property(fc.constantFrom<ScreenSize>('sm', 'md', 'lg', 'xl'), (screenSize) => {
          const spacing = responsiveSpacing[screenSize];
          const values = [spacing.xs, spacing.sm, spacing.md, spacing.lg, spacing.xl, spacing['2xl'], spacing['3xl']];

          for (let i = 1; i < values.length; i++) {
            if (values[i] < values[i - 1]) {
              return false;
            }
          }

          return true;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Responsive font sizing', () => {
    it('should apply correct font size multipliers for each screen size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          fc.constantFrom<ScreenSize>('sm', 'md', 'lg', 'xl'),
          (baseSize, screenSize) => {
            const responsiveSize = getResponsiveFontSize(baseSize, screenSize);
            const expectedSize = Math.round(baseSize * fontSizeMultipliers[screenSize]);

            return responsiveSize === expectedSize;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should have smaller or equal font sizes on small screens', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), (baseSize) => {
          const smSize = getResponsiveFontSize(baseSize, 'sm');
          const mdSize = getResponsiveFontSize(baseSize, 'md');

          return smSize <= mdSize;
        }),
        { numRuns: 100 },
      );
    });

    it('should have larger or equal font sizes on large screens', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), (baseSize) => {
          const lgSize = getResponsiveFontSize(baseSize, 'lg');
          const mdSize = getResponsiveFontSize(baseSize, 'md');

          return lgSize >= mdSize;
        }),
        { numRuns: 100 },
      );
    });

    it('should always return positive font sizes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }),
          fc.constantFrom<ScreenSize>('sm', 'md', 'lg', 'xl'),
          (baseSize, screenSize) => {
            const responsiveSize = getResponsiveFontSize(baseSize, screenSize);

            return responsiveSize > 0;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Touch target sizing', () => {
    it('should ensure minimum touch target size of 44px', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (size) => {
          const touchSize = ensureTouchTarget(size);

          return touchSize >= MIN_TOUCH_TARGET;
        }),
        { numRuns: 100 },
      );
    });

    it('should not change values that already meet minimum touch target', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_TOUCH_TARGET, max: 200 }), (size) => {
          const touchSize = ensureTouchTarget(size);

          return touchSize === size;
        }),
        { numRuns: 100 },
      );
    });

    it('should increase values below minimum to MIN_TOUCH_TARGET', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: MIN_TOUCH_TARGET - 1 }), (size) => {
          const touchSize = ensureTouchTarget(size);

          return touchSize === MIN_TOUCH_TARGET;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Breakpoint definitions', () => {
    it('should have breakpoints in ascending order', () => {
      expect(breakpoints.sm).toBeLessThan(breakpoints.md);
      expect(breakpoints.md).toBeLessThan(breakpoints.lg);
      expect(breakpoints.lg).toBeLessThan(breakpoints.xl);
    });

    it('should have positive breakpoint values', () => {
      fc.assert(
        fc.property(fc.constantFrom('sm', 'md', 'lg', 'xl'), (key) => {
          const value = breakpoints[key as keyof typeof breakpoints];

          return typeof value === 'number' && value > 0;
        }),
        { numRuns: 100 },
      );
    });

    it('should have MIN_TOUCH_TARGET set to 44 pixels', () => {
      expect(MIN_TOUCH_TARGET).toBe(44);
    });
  });
});
