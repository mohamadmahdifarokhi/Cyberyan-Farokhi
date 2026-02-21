import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

interface ModernCardProps {
  children: React.ReactNode;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  style?: ViewStyle;
}

export const ModernCard: React.FC<ModernCardProps> = ({ children, elevation = 'md', padding = 'md', style }) => {
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => createStyles(theme, responsive, elevation, padding),
    [theme, responsive, elevation, padding],
  );

  return <View style={[styles.card, style]}>{children}</View>;
};
const createStyles = (
  theme: ReturnType<typeof useTheme>,
  responsive: ReturnType<typeof useResponsive>,
  elevation: 'sm' | 'md' | 'lg' | 'xl',
  padding: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl',
) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      padding: responsive.spacing[padding],
      ...theme.shadows[elevation],
    },
  });
