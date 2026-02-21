import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAppContext } from '../context/AppContext';
import { ModernCard } from '../components/ModernCard';
import { ModernButton } from '../components/ModernButton';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { ExportService } from '../services/export';

interface WalletScreenProps {
  navigation?: unknown;
}

export const WalletScreen: React.FC<WalletScreenProps> = () => {
  const { credentials, biometricAvailable, biometricEnabled, setBiometricEnabled, lockApp } = useAppContext();
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [cardAnimation] = useState(() => new Animated.Value(0));
  const [modalAnimation] = useState(() => new Animated.Value(0));

  React.useEffect(() => {
    if (credentials) {
      Animated.spring(cardAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [credentials, cardAnimation]);
  React.useEffect(() => {
    if (showQRModal) {
      Animated.spring(modalAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showQRModal, modalAnimation]);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };
  const handleExport = async () => {
    if (!credentials) return;
    try {
      const result = await ExportService.exportAndShare(credentials, {
        includeSignature: true,
        format: 'pretty',
      });

      if (result.success) {
        Alert.alert('Success', 'Credential exported successfully');
      } else if (result.error && !result.error.includes('dismissed')) {
        Alert.alert('Export Failed', result.error);
      }
    } catch {
      Alert.alert('Export Failed', 'Could not export credential');
    }
  };
  const filterCredentials = () => {
    if (!credentials || !searchQuery.trim()) {
      return credentials;
    }
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      credentials.did.toLowerCase().includes(query) ||
      credentials.vc.credentialSubject.name.toLowerCase().includes(query) ||
      credentials.vc.credentialSubject.email.toLowerCase().includes(query);

    return matchesSearch ? credentials : null;
  };
  const filteredCredentials = filterCredentials();

  if (!credentials) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No credentials found</Text>
      </View>
    );
  }
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  const handleBiometricToggle = async (value: boolean) => {
    try {
      await setBiometricEnabled(value);
      if (value) {
        Alert.alert(
          'Biometric Authentication Enabled',
          'Your app is now secured with biometric authentication. The app will lock when you close it.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          'Biometric Authentication Disabled',
          'Your app is no longer secured with biometric authentication.',
          [{ text: 'OK' }],
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to update biometric settings. Please try again.', [{ text: 'OK' }]);
    }
  };
  const handleLockApp = async () => {
    if (!biometricEnabled) {
      Alert.alert('Biometric Not Enabled', 'Please enable biometric authentication first.', [{ text: 'OK' }]);

      return;
    }
    await lockApp();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary.solid} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Digital Wallet</Text>
        <Text style={styles.subtitle}>Your Verifiable Credentials</Text>
      </View>
      {}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search credentials..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {}
      {!filteredCredentials && searchQuery.trim() ? (
        <View style={styles.emptySearchContainer}>
          <Text style={styles.emptySearchText}>No credentials match your search</Text>
          <Text style={styles.emptySearchSubtext}>Try a different search term</Text>
        </View>
      ) : filteredCredentials ? (
        <Animated.View
          style={{
            opacity: cardAnimation,
            transform: [
              {
                translateY: cardAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          }}
        >
          {}
          <ModernCard elevation="lg" style={styles.credentialCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Verifiable Credential</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            </View>
            <View style={styles.credentialField}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{filteredCredentials.vc.credentialSubject.name}</Text>
            </View>
            <View style={styles.credentialField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{filteredCredentials.vc.credentialSubject.email}</Text>
            </View>
            <View style={styles.credentialField}>
              <Text style={styles.fieldLabel}>Issuance Date</Text>
              <Text style={styles.fieldValue}>{formatDate(filteredCredentials.vc.issuanceDate)}</Text>
            </View>
            <View style={styles.credentialField}>
              <Text style={styles.fieldLabel}>Issuer</Text>
              <Text style={styles.fieldValue}>{filteredCredentials.vc.issuer}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.credentialField}>
              <Text style={styles.fieldLabel}>Decentralized Identifier (DID)</Text>
              <Text style={styles.didText}>{filteredCredentials.did}</Text>
            </View>
            {}
            <View style={styles.actionButtons}>
              <ModernButton
                title="Show QR Badge"
                onPress={() => setShowQRModal(true)}
                variant="primary"
                size="md"
                style={styles.actionButton}
              />
              <ModernButton
                title="Export"
                onPress={handleExport}
                variant="outline"
                size="md"
                style={styles.actionButton}
                testID="export-button"
              />
            </View>
          </ModernCard>
        </Animated.View>
      ) : null}
      {}
      {biometricAvailable && (
        <ModernCard elevation="md" style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Security Settings</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>Use fingerprint or face recognition to secure your app</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: theme.colors.border.primary, true: theme.colors.primary.solid }}
              thumbColor={biometricEnabled ? theme.colors.primary.end : theme.colors.text.disabled}
            />
          </View>
          {biometricEnabled && (
            <ModernButton
              title="🔒 Lock App Now"
              onPress={handleLockApp}
              variant="secondary"
              size="md"
              style={styles.lockButton}
            />
          )}
        </ModernCard>
      )}
      {}
      <ModernButton title="View Audit Logs" onPress={() => {}} variant="outline" size="lg" style={styles.auditButton} />
      {}
      <Modal visible={showQRModal} transparent={true} animationType="none" onRequestClose={() => setShowQRModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowQRModal(false)}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: modalAnimation,
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <ModernCard elevation="xl" style={styles.qrModalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.qrBadgeTitle}>QR Badge</Text>
                  <TouchableOpacity onPress={() => setShowQRModal(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={JSON.stringify({
                      did: credentials.did,
                      vc: credentials.vc,
                    })}
                    size={220}
                  />
                </View>
                <View style={styles.qrInfo}>
                  <View style={styles.qrInfoRow}>
                    <Text style={styles.qrInfoLabel}>Name:</Text>
                    <Text style={styles.qrInfoValue}>{credentials.vc.credentialSubject.name}</Text>
                  </View>
                  <View style={styles.qrInfoRow}>
                    <Text style={styles.qrInfoLabel}>DID:</Text>
                    <Text style={styles.qrInfoValue} numberOfLines={1} ellipsizeMode="middle">
                      {credentials.did}
                    </Text>
                  </View>
                </View>
              </ModernCard>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};
const createStyles = (theme: ReturnType<typeof useTheme>, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      padding: responsive.spacing.lg,
      paddingTop: responsive.spacing.xl,
    },
    title: {
      fontSize: responsive.fontSize('2xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.xs,
    },
    subtitle: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
    },
    searchContainer: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.lg,
      position: 'relative',
    },
    searchInput: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.borderRadius.lg,
      padding: responsive.spacing.md,
      paddingRight: responsive.spacing['2xl'],
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.primary,
      ...theme.shadows.sm,
      minHeight: responsive.touchTarget,
    },
    clearButton: {
      position: 'absolute',
      right: responsive.spacing.md,
      top: '50%',
      transform: [{ translateY: -12 }],
      width: responsive.touchTarget,
      height: responsive.touchTarget,
      borderRadius: responsive.touchTarget / 2,
      backgroundColor: theme.colors.text.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      color: theme.colors.surface.primary,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.bold,
    },
    emptySearchContainer: {
      padding: responsive.spacing.xl,
      alignItems: 'center',
    },
    emptySearchText: {
      fontSize: responsive.fontSize('lg'),
      color: theme.colors.text.secondary,
      marginBottom: responsive.spacing.sm,
    },
    emptySearchSubtext: {
      fontSize: responsive.fontSize('sm'),
      color: theme.colors.text.disabled,
    },
    credentialCard: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.spacing.lg,
    },
    cardTitle: {
      fontSize: responsive.fontSize('xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    badge: {
      backgroundColor: theme.colors.success,
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.xs,
      borderRadius: theme.borderRadius.full,
      minHeight: responsive.touchTarget,
      justifyContent: 'center',
    },
    badgeText: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize('sm'),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    credentialField: {
      marginBottom: responsive.spacing.md,
    },
    fieldLabel: {
      fontSize: responsive.fontSize('sm'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.secondary,
      marginBottom: responsive.spacing.xs,
    },
    fieldValue: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.primary,
    },
    didText: {
      fontSize: responsive.fontSize('sm'),
      color: theme.colors.primary.solid,
      fontFamily: theme.typography.fontFamily.mono,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginVertical: responsive.spacing.lg,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: responsive.spacing.md,
      marginTop: responsive.spacing.md,
    },
    actionButton: {
      flex: 1,
    },
    settingsCard: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.lg,
    },
    sectionTitle: {
      fontSize: responsive.fontSize('lg'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.md,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsive.spacing.sm,
      minHeight: responsive.touchTarget,
    },
    settingInfo: {
      flex: 1,
      marginRight: responsive.spacing.md,
    },
    settingLabel: {
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.xs,
    },
    settingDescription: {
      fontSize: responsive.fontSize('sm'),
      color: theme.colors.text.secondary,
    },
    lockButton: {
      marginTop: responsive.spacing.md,
    },
    analyticsButton: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.md,
    },
    auditButton: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.xl,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay.dark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
    },
    qrModalCard: {
      padding: responsive.spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.spacing.lg,
    },
    qrBadgeTitle: {
      fontSize: responsive.fontSize('xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    closeButton: {
      width: responsive.touchTarget,
      height: responsive.touchTarget,
      borderRadius: responsive.touchTarget / 2,
      backgroundColor: theme.colors.border.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 20,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.bold,
    },
    qrContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: responsive.spacing.lg,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.borderRadius.lg,
      marginBottom: responsive.spacing.lg,
    },
    qrInfo: {
      gap: responsive.spacing.sm,
    },
    qrInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    qrInfoLabel: {
      fontSize: responsive.fontSize('sm'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.secondary,
    },
    qrInfoValue: {
      fontSize: responsive.fontSize('sm'),
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'right',
      marginLeft: responsive.spacing.md,
    },
    emptyText: {
      fontSize: responsive.fontSize('lg'),
      textAlign: 'center',
      marginBottom: responsive.spacing.lg,
      color: theme.colors.text.secondary,
    },
  });
