import { theme } from '../theme';

describe('Navigation Integration', () => {
  it('should have proper tab bar styling configuration', () => {
    expect(theme.colors.primary.solid).toBeDefined();
    expect(theme.colors.text.secondary).toBeDefined();
    expect(theme.colors.surface.primary).toBeDefined();
    expect(theme.colors.border.primary).toBeDefined();
  });

  it('should have proper shadow configuration for tab bar', () => {
    expect(theme.shadows.lg).toBeDefined();
    expect(theme.shadows.lg.shadowColor).toBe('#000');
    expect(theme.shadows.lg.elevation).toBe(5);
  });

  it('should have proper spacing for navigation elements', () => {
    expect(theme.spacing.sm).toBe(8);
    expect(theme.spacing.lg).toBe(24);
  });

  it('should have proper colors for active and inactive tabs', () => {
    expect(theme.colors.primary.solid).toBe('#6B7FDB');

    expect(theme.colors.text.secondary).toBe('#4b5563');
  });

  it('should have proper border configuration', () => {
    expect(theme.colors.border.primary).toBe('#e5e7eb');
  });

  it('should have proper background colors', () => {
    expect(theme.colors.background.primary).toBe('#f8f9fa');
    expect(theme.colors.surface.primary).toBe('#ffffff');
  });
});
