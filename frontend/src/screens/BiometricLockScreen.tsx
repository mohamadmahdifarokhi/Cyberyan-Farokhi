import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { GradientBackground, ModernButton } from '../components';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

export const BiometricLockScreen: React.FC = () => {
  const { unlockApp, biometricAvailable } = useAppContext();
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const handleBiometricUnlock = useCallback(async () => {
    setIsUnlocking(true);
    try {
      const success = await unlockApp();

      if (!success) {
        Alert.alert('Authentication Failed', 'Please try again or use password authentication.', [{ text: 'OK' }]);
      }
    } catch {
      Alert.alert('Error', 'An error occurred during authentication. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsUnlocking(false);
    }
  }, [unlockApp]);

  useEffect(() => {
    if (biometricAvailable) {
      handleBiometricUnlock();
    }
  }, [biometricAvailable, handleBiometricUnlock]);
  const handlePasswordFallback = () => {
    Alert.alert(
      'Password Authentication',
      "Password authentication would be implemented here. For this demo, we'll unlock the app.",
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unlock',
          onPress: async () => {
            await unlockApp();
          },
        },
      ],
    );
  };

  return (
    <GradientBackground variant="primary">
      <View style={styles.container}>
        <View style={styles.lockIconContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.subtitle}>Authenticate to access your credentials</Text>
        <View style={styles.buttonContainer}>
          <ModernButton
            title={isUnlocking ? 'Authenticating...' : 'Unlock with Biometrics'}
            onPress={handleBiometricUnlock}
            variant="secondary"
            size="lg"
            loading={isUnlocking}
            disabled={isUnlocking || !biometricAvailable}
          />
          <TouchableOpacity style={styles.fallbackButton} onPress={handlePasswordFallback} disabled={isUnlocking}>
            <Text style={styles.fallbackText}>Use Password Instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.spacing.xl,
    },
    lockIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.overlay.light,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: responsive.spacing.xl,
    },
    lockIcon: {
      fontSize: 64,
    },
    title: {
      fontSize: responsive.fontSize('3xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.inverse,
      textAlign: 'center',
      marginBottom: responsive.spacing.sm,
    },
    subtitle: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.inverse,
      textAlign: 'center',
      marginBottom: responsive.spacing['2xl'],
      opacity: 0.9,
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 400,
    },
    fallbackButton: {
      marginTop: responsive.spacing.lg,
      padding: responsive.spacing.md,
      alignItems: 'center',
      minHeight: responsive.touchTarget,
    },
    fallbackText: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize('base'),
      textDecorationLine: 'underline',
    },
  });
