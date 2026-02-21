import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
}) => {
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive, size), [theme, responsive, size]);
  const isDisabled = disabled || loading;

  if (variant === 'primary' || variant === 'secondary') {
    const gradientColors =
      variant === 'primary'
        ? [theme.colors.primary.start, theme.colors.primary.end]
        : [theme.colors.secondary.start, theme.colors.secondary.end];

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.container, style]}
        testID={testID}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, isDisabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <Text style={[styles.text, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.container, styles.outlineButton, isDisabled && styles.disabled, style]}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary.solid} />
        ) : (
          <Text style={[styles.text, styles.outlineText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={[styles.textButton, style]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.primary.solid} />
      ) : (
        <Text style={[styles.text, styles.textButtonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
const createStyles = (
  theme: ReturnType<typeof useTheme>,
  responsive: ReturnType<typeof useResponsive>,
  size: 'sm' | 'md' | 'lg',
) => {
  const sizeStyles = {
    sm: { paddingVertical: responsive.spacing.sm, paddingHorizontal: responsive.spacing.md },
    md: { paddingVertical: responsive.spacing.md, paddingHorizontal: responsive.spacing.lg },
    lg: { paddingVertical: responsive.spacing.lg, paddingHorizontal: responsive.spacing.xl },
  };
  const textSizeStyles = {
    sm: { fontSize: responsive.fontSize('sm') },
    md: { fontSize: responsive.fontSize('base') },
    lg: { fontSize: responsive.fontSize('lg') },
  };

  return StyleSheet.create({
    container: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      ...theme.shadows.md,
      minHeight: responsive.touchTarget,
    },
    gradient: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      minHeight: responsive.touchTarget,
      ...sizeStyles[size],
    },
    text: {
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.fontWeight.semibold,
      textAlign: 'center',
      ...textSizeStyles[size],
    },
    outlineButton: {
      borderWidth: 2,
      borderColor: theme.colors.primary.solid,
      backgroundColor: theme.colors.surface.primary,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive.touchTarget,
      ...sizeStyles[size],
    },
    outlineText: {
      color: theme.colors.primary.solid,
    },
    textButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive.touchTarget,
      ...sizeStyles[size],
    },
    textButtonText: {
      color: theme.colors.primary.solid,
    },
    disabled: {
      opacity: 0.5,
    },
  });
};
