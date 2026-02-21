import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { jwtService } from '../services/jwtService';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const SettingsScreen: React.FC<{ navigation?: unknown }> = () => {
  const { isDarkMode, setDarkMode, biometricEnabled, setBiometricEnabled, biometricAvailable, logout, jwt } =
    useAppContext();
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const userEmail = React.useMemo(() => {
    if (!jwt) return null;
    try {
      const decoded = jwtService.verifyJWT(jwt);

      return decoded.email || null;
    } catch {
      return null;
    }
  }, [jwt]);
  const handleLogout = () => {
    console.log('[SettingsScreen] handleLogout called!');
    setShowLogoutDialog(true);
  };
  const confirmLogout = async () => {
    console.log('[SettingsScreen] Logout confirmed');
    setShowLogoutDialog(false);
    try {
      await logout();
      console.log('[SettingsScreen] Logout successful');
    } catch {
      console.error('[SettingsScreen] Logout error');
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };
  const cancelLogout = () => {
    console.log('[SettingsScreen] Logout cancelled');
    setShowLogoutDialog(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Appearance</Text>
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary.solid + '20' }]}>
            <Icon name="theme-light-dark" size={20} color={theme.colors.primary.solid} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Dark Mode</Text>
            <Text style={styles.settingDescription}>{isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: theme.colors.border.primary, true: theme.colors.primary.solid }}
            thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>
      <Text style={styles.sectionHeader}>Security</Text>
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: theme.colors.success + '20' }]}>
            <Icon name="fingerprint" size={20} color={theme.colors.success} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Biometric Authentication</Text>
            <Text style={styles.settingDescription}>
              {biometricAvailable ? (biometricEnabled ? 'Enabled' : 'Disabled') : 'Not available on this device'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            disabled={!biometricAvailable}
            trackColor={{ false: theme.colors.border.primary, true: theme.colors.success }}
            thumbColor={biometricEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>
      <Text style={styles.sectionHeader}>Account</Text>
      <View style={styles.section}>
        {userEmail && (
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary.solid + '20' }]}>
              <Icon name="account" size={20} color={theme.colors.primary.solid} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Email</Text>
              <Text style={styles.settingDescription}>{userEmail}</Text>
            </View>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.settingRow,
            pressed && { opacity: 0.7, backgroundColor: theme.colors.error + '10' },
          ]}
          onPress={handleLogout}
        >
          <View style={[styles.settingIcon, { backgroundColor: theme.colors.error + '20' }]}>
            <Icon name="logout" size={20} color={theme.colors.error} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.error }]}>Logout</Text>
            <Text style={styles.settingDescription}>Sign out of your account</Text>
          </View>
          <Icon name="chevron-right" size={20} color={theme.colors.text.tertiary} />
        </Pressable>
      </View>
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmColor={theme.colors.error}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </ScrollView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    section: {
      backgroundColor: theme.colors.surface.primary,
      marginTop: responsive.spacing.md,
      paddingVertical: responsive.spacing.sm,
    },
    sectionHeader: {
      fontSize: responsive.fontSize('xs'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.secondary,
      paddingHorizontal: responsive.spacing.lg,
      paddingTop: responsive.spacing.lg,
      paddingBottom: responsive.spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: responsive.spacing.lg,
      paddingVertical: responsive.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.primary,
      minHeight: responsive.touchTarget,
      cursor: 'pointer',
    },
    settingIcon: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: responsive.spacing.md,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: responsive.fontSize('xs'),
      color: theme.colors.text.secondary,
    },
  });
