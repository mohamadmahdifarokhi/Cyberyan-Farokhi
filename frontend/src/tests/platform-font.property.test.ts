import * as fc from 'fast-check';
import { typography } from '../theme/typography';

describe('Platform Font Property Tests', () => {
  describe('Property 3: Platform-specific font application', () => {
    it('should have correct platform-specific font families in typography config', () => {
      expect(typography.fontFamily.ios).toBe('System');
      expect(typography.fontFamily.android).toBe('Roboto');
      expect(typography.fontFamily.web).toContain('apple-system');
      expect(typography.fontFamily.web).toContain('Roboto');
      expect(typography.fontFamily.web).toContain('sans-serif');
    });

    it('should have monospace font defined', () => {
      expect(typography.fontFamily.mono).toBeDefined();
      expect(typeof typography.fontFamily.mono).toBe('string');
      expect(typography.fontFamily.mono.length).toBeGreaterThan(0);
    });

    it('should ensure all font family values are non-empty strings', () => {
      fc.assert(
        fc.property(fc.constantFrom('ios', 'android', 'web', 'mono', 'regular', 'medium', 'bold'), (fontKey) => {
          const fontValue = typography.fontFamily[fontKey as keyof typeof typography.fontFamily];

          return typeof fontValue === 'string' && fontValue.length > 0;
        }),
        { numRuns: 100 },
      );
    });

    it('should use System font for iOS (San Francisco)', () => {
      expect(typography.fontFamily.ios).toBe('System');
    });

    it('should use Roboto font for Android', () => {
      expect(typography.fontFamily.android).toBe('Roboto');
    });

    it('should have comprehensive fallback chain for web', () => {
      const webFont = typography.fontFamily.web;

      expect(webFont).toContain('apple-system');
      expect(webFont).toContain('BlinkMacSystemFont');

      expect(webFont).toContain('Roboto');
      expect(webFont).toContain('Arial');

      expect(webFont).toContain('sans-serif');
    });

    it('should have distinct font families for each platform', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ios', 'android', 'web'),
          fc.constantFrom('ios', 'android', 'web'),
          (platform1, platform2) => {
            const font1 = typography.fontFamily[platform1 as keyof typeof typography.fontFamily];
            const font2 = typography.fontFamily[platform2 as keyof typeof typography.fontFamily];

            if (platform1 === platform2) {
              return font1 === font2;
            }

            return font1 !== font2;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should match platform font conventions for all platforms', () => {
      const platformFonts = [
        { platform: 'ios', expected: 'System' },
        { platform: 'android', expected: 'Roboto' },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...platformFonts), ({ platform, expected }) => {
          const font = typography.fontFamily[platform as keyof typeof typography.fontFamily];

          return font === expected;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Font size and weight properties', () => {
    it('should have positive font sizes', () => {
      fc.assert(
        fc.property(fc.constantFrom('xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'), (sizeKey) => {
          const size = typography.fontSize[sizeKey as keyof typeof typography.fontSize];

          return typeof size === 'number' && size > 0;
        }),
        { numRuns: 100 },
      );
    });

    it('should have font sizes in ascending order', () => {
      const sizes = [
        typography.fontSize.xs,
        typography.fontSize.sm,
        typography.fontSize.base,
        typography.fontSize.lg,
        typography.fontSize.xl,
        typography.fontSize['2xl'],
        typography.fontSize['3xl'],
        typography.fontSize['4xl'],
        typography.fontSize['5xl'],
      ];

      for (let i = 1; i < sizes.length; i++) {
        expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
      }
    });

    it('should have valid font weight values', () => {
      fc.assert(
        fc.property(fc.constantFrom('light', 'regular', 'medium', 'semibold', 'bold', 'extrabold'), (weightKey) => {
          const weight = typography.fontWeight[weightKey as keyof typeof typography.fontWeight];
          const numericWeight = parseInt(weight, 10);

          return numericWeight >= 100 && numericWeight <= 900 && numericWeight % 100 === 0;
        }),
        { numRuns: 100 },
      );
    });

    it('should have reasonable line height values', () => {
      fc.assert(
        fc.property(fc.constantFrom('tight', 'normal', 'relaxed', 'loose'), (lineHeightKey) => {
          const lineHeight = typography.lineHeight[lineHeightKey as keyof typeof typography.lineHeight];

          return typeof lineHeight === 'number' && lineHeight >= 1.0 && lineHeight <= 3.0;
        }),
        { numRuns: 100 },
      );
    });

    it('should have font weights in ascending order', () => {
      const weights = [
        parseInt(typography.fontWeight.light, 10),
        parseInt(typography.fontWeight.regular, 10),
        parseInt(typography.fontWeight.medium, 10),
        parseInt(typography.fontWeight.semibold, 10),
        parseInt(typography.fontWeight.bold, 10),
        parseInt(typography.fontWeight.extrabold, 10),
      ];

      for (let i = 1; i < weights.length; i++) {
        expect(weights[i]).toBeGreaterThan(weights[i - 1]);
      }
    });
  });
});
