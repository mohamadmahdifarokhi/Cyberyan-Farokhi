import { renderHook } from '@testing-library/react-native';
import { useResponsive } from '../hooks/useResponsive';
import { MIN_TOUCH_TARGET } from '../theme/responsive';

describe('useResponsive hook', () => {
  describe('Basic functionality', () => {
    it('should return responsive values', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.screenSize).toBeDefined();
      expect(typeof result.current.isSmallScreen).toBe('boolean');
      expect(typeof result.current.isMediumScreen).toBe('boolean');
      expect(typeof result.current.isLargeScreen).toBe('boolean');
      expect(result.current.spacing).toBeDefined();
      expect(typeof result.current.fontSize).toBe('function');
      expect(result.current.touchTarget).toBe(MIN_TOUCH_TARGET);
      expect(typeof result.current.width).toBe('number');
      expect(typeof result.current.height).toBe('number');
    });

    it('should provide minimum touch target size of 44px', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.touchTarget).toBe(44);
    });
  });

  describe('Responsive spacing', () => {
    it('should return spacing object with all required keys', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.spacing).toBeDefined();
      expect(result.current.spacing.xs).toBeDefined();
      expect(result.current.spacing.sm).toBeDefined();
      expect(result.current.spacing.md).toBeDefined();
      expect(result.current.spacing.lg).toBeDefined();
      expect(result.current.spacing.xl).toBeDefined();
      expect(result.current.spacing['2xl']).toBeDefined();
      expect(result.current.spacing['3xl']).toBeDefined();
    });

    it('should have positive spacing values', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.spacing.xs).toBeGreaterThan(0);
      expect(result.current.spacing.sm).toBeGreaterThan(0);
      expect(result.current.spacing.md).toBeGreaterThan(0);
      expect(result.current.spacing.lg).toBeGreaterThan(0);
      expect(result.current.spacing.xl).toBeGreaterThan(0);
    });
  });

  describe('Responsive font sizing', () => {
    it('should provide fontSize function', () => {
      const { result } = renderHook(() => useResponsive());

      expect(typeof result.current.fontSize).toBe('function');
    });

    it('should return positive font sizes', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.fontSize('xs')).toBeGreaterThan(0);
      expect(result.current.fontSize('sm')).toBeGreaterThan(0);
      expect(result.current.fontSize('base')).toBeGreaterThan(0);
      expect(result.current.fontSize('lg')).toBeGreaterThan(0);
      expect(result.current.fontSize('xl')).toBeGreaterThan(0);
    });

    it('should return increasing font sizes', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.fontSize('sm')).toBeLessThan(result.current.fontSize('base'));
      expect(result.current.fontSize('base')).toBeLessThan(result.current.fontSize('lg'));
      expect(result.current.fontSize('lg')).toBeLessThan(result.current.fontSize('xl'));
    });
  });

  describe('Screen size detection', () => {
    it('should detect screen size', () => {
      const { result } = renderHook(() => useResponsive());

      expect(['sm', 'md', 'lg', 'xl']).toContain(result.current.screenSize);
    });

    it('should have exactly one screen size flag set to true', () => {
      const { result } = renderHook(() => useResponsive());

      const flags = [result.current.isSmallScreen, result.current.isMediumScreen, result.current.isLargeScreen];

      expect(flags.some((flag) => flag === true)).toBe(true);
    });
  });

  describe('Dimension tracking', () => {
    it('should provide current width and height', () => {
      const { result } = renderHook(() => useResponsive());

      expect(typeof result.current.width).toBe('number');
      expect(typeof result.current.height).toBe('number');
      expect(result.current.width).toBeGreaterThan(0);
      expect(result.current.height).toBeGreaterThan(0);
    });
  });
});
