import * as fc from 'fast-check';
import { lightColors, darkColors } from '../theme/colors';

function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function getTextColors(theme: typeof lightColors): string[] {
  return [theme.text.primary, theme.text.secondary, theme.text.tertiary, theme.text.link];
}

function getBackgroundColors(theme: typeof lightColors): string[] {
  return [
    theme.background.primary,
    theme.background.secondary,
    theme.background.tertiary,
    theme.surface.primary,
    theme.surface.secondary,
    theme.surface.elevated,
  ];
}

describe('Color Contrast Property Tests', () => {
  describe('Property 2: Color contrast compliance', () => {
    it('should ensure all light mode text/background combinations meet 4.5:1 contrast for normal text', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getTextColors(lightColors)),
          fc.constantFrom(...getBackgroundColors(lightColors)),
          (textColor, backgroundColor) => {
            const contrastRatio = getContrastRatio(textColor, backgroundColor);

            const minRatio = textColor === lightColors.text.tertiary ? 3.0 : 4.5;

            return contrastRatio >= minRatio;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should ensure all dark mode text/background combinations meet 4.5:1 contrast for normal text', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getTextColors(darkColors)),
          fc.constantFrom(...getBackgroundColors(darkColors)),
          (textColor, backgroundColor) => {
            const contrastRatio = getContrastRatio(textColor, backgroundColor);

            const minRatio = textColor === darkColors.text.tertiary ? 3.0 : 4.5;

            return contrastRatio >= minRatio;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should ensure light mode primary and secondary text meet 4.5:1 on all backgrounds', () => {
      const primaryAndSecondaryText = [lightColors.text.primary, lightColors.text.secondary];

      fc.assert(
        fc.property(
          fc.constantFrom(...primaryAndSecondaryText),
          fc.constantFrom(...getBackgroundColors(lightColors)),
          (textColor, backgroundColor) => {
            const contrastRatio = getContrastRatio(textColor, backgroundColor);

            return contrastRatio >= 4.5;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should ensure dark mode primary and secondary text meet 4.5:1 on all backgrounds', () => {
      const primaryAndSecondaryText = [darkColors.text.primary, darkColors.text.secondary];

      fc.assert(
        fc.property(
          fc.constantFrom(...primaryAndSecondaryText),
          fc.constantFrom(...getBackgroundColors(darkColors)),
          (textColor, backgroundColor) => {
            const contrastRatio = getContrastRatio(textColor, backgroundColor);

            return contrastRatio >= 4.5;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should ensure light mode tertiary text meets 3:1 contrast for large text', () => {
      fc.assert(
        fc.property(fc.constantFrom(...getBackgroundColors(lightColors)), (backgroundColor) => {
          const contrastRatio = getContrastRatio(lightColors.text.tertiary, backgroundColor);

          return contrastRatio >= 3.0;
        }),
        { numRuns: 100 },
      );
    });

    it('should ensure dark mode tertiary text meets 3:1 contrast for large text', () => {
      fc.assert(
        fc.property(fc.constantFrom(...getBackgroundColors(darkColors)), (backgroundColor) => {
          const contrastRatio = getContrastRatio(darkColors.text.tertiary, backgroundColor);

          return contrastRatio >= 3.0;
        }),
        { numRuns: 100 },
      );
    });

    it('should ensure link text has sufficient contrast in both light and dark modes', () => {
      fc.assert(
        fc.property(fc.constantFrom(...getBackgroundColors(lightColors)), (backgroundColor) => {
          const contrastRatio = getContrastRatio(lightColors.text.link, backgroundColor);

          return contrastRatio >= 4.5;
        }),
        { numRuns: 100 },
      );

      fc.assert(
        fc.property(fc.constantFrom(...getBackgroundColors(darkColors)), (backgroundColor) => {
          const contrastRatio = getContrastRatio(darkColors.text.link, backgroundColor);

          return contrastRatio >= 4.5;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Contrast calculation verification', () => {
    it('should calculate correct contrast ratio for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');

      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate correct contrast ratio for white on black', () => {
      const ratio = getContrastRatio('#ffffff', '#000000');

      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate same ratio regardless of color order', () => {
      const ratio1 = getContrastRatio('#667eea', '#ffffff');
      const ratio2 = getContrastRatio('#ffffff', '#667eea');

      expect(ratio1).toBe(ratio2);
    });
  });
});
