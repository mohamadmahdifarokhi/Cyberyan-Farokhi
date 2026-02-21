import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { ModernCard } from './ModernCard';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ModernCard elevation="xl" style={styles.dialog}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  { backgroundColor: confirmColor || theme.colors.primary.solid },
                  pressed && styles.buttonPressed,
                ]}
                onPress={onConfirm}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </Pressable>
            </View>
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
    },
    title: {
      fontSize: responsive.fontSize('xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.md,
    },
    message: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
      marginBottom: responsive.spacing.xl,
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: responsive.spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: responsive.spacing.md,
      paddingHorizontal: responsive.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive.touchTarget,
    },
    cancelButton: {
      backgroundColor: theme.colors.surface.secondary,
      borderWidth: 2,
      borderColor: theme.colors.border.primary,
    },
    confirmButton: {
      ...theme.shadows.sm,
    },
    buttonPressed: {
      opacity: 0.7,
    },
    cancelButtonText: {
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    confirmButtonText: {
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.inverse,
    },
  });
