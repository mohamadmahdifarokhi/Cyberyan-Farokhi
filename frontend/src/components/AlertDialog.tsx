import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { ModernCard } from './ModernCard';

interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  onClose: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  title,
  message,
  buttonText = 'OK',
  type = 'error',
  onClose,
}) => {
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const getIconAndColor = () => {
    switch (type) {
      case 'error':
        return { icon: '⚠️', color: theme.colors.error };
      case 'success':
        return { icon: '✓', color: theme.colors.success };
      case 'warning':
        return { icon: '⚠', color: '#ff9800' };
      case 'info':
      default:
        return { icon: 'ℹ', color: theme.colors.primary.solid };
    }
  };
  const { icon, color } = getIconAndColor();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ModernCard elevation="xl" style={styles.dialog}>
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color }]}>{icon}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <Pressable
              style={({ pressed }) => [styles.button, { backgroundColor: color }, pressed && styles.buttonPressed]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </Pressable>
          </ModernCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
const createStyles = (theme: ReturnType<typeof useTheme>, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay.dark,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.spacing.lg,
    },
    dialog: {
      width: '100%',
      maxWidth: 400,
      padding: responsive.spacing.xl,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: responsive.spacing.md,
    },
    icon: {
      fontSize: 48,
    },
    title: {
      fontSize: responsive.fontSize('xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.md,
      textAlign: 'center',
    },
    message: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
      marginBottom: responsive.spacing.xl,
      lineHeight: 22,
      textAlign: 'center',
    },
    button: {
      width: '100%',
      paddingVertical: responsive.spacing.md,
      paddingHorizontal: responsive.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive.touchTarget,
      ...theme.shadows.sm,
    },
    buttonPressed: {
      opacity: 0.7,
    },
    buttonText: {
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.inverse,
    },
  });
