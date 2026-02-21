import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, variant = 'primary', style }) => {
  const theme = useTheme();
  const gradientColors =
    variant === 'primary'
      ? [theme.colors.primary.start, theme.colors.primary.end]
      : [theme.colors.secondary.start, theme.colors.secondary.end];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
