import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { UserCredentials, AuditLog, AppContextValue } from '../types';
import {
  saveCredentials,
  loadCredentials,
  saveJWT,
  loadJWT,
  clearStorage,
  saveBiometricEnabled,
  loadBiometricEnabled,
  saveAppLocked,
  loadAppLocked,
  saveFCMToken,
  loadFCMToken,
  saveAuditLogs,
  loadAuditLogs,
} from '../utils/storage';
import { apiService } from '../services/api';
import { biometricService } from '../services/biometric';
import { pushNotificationService } from '../services/pushNotification';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [credentials, setCredentialsState] = useState<UserCredentials | null>(null);
  const [jwt, setJWTState] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [biometricEnabled, setBiometricEnabledState] = useState<boolean>(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [fcmToken, setFCMTokenState] = useState<string | null>(null);
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(true);
  const [isThemeLoaded, setIsThemeLoaded] = useState<boolean>(false);
  const registerFCMToken = useCallback(
    async (token: string): Promise<void> => {
      if (!credentials?.did) {
        console.log('No credentials available, skipping FCM token registration');

        return;
      }
      try {
        const platform = Platform.OS as 'ios' | 'android';

        await apiService.registerFCMToken(credentials.did, token, platform);
        console.log('FCM token registered with backend');
      } catch (_error) {
        console.error('Failed to register FCM token with backend:', _error);
      }
    },
    [credentials?.did],
  );
  const userEmail = React.useMemo(() => {
    if (!jwt) return null;
    try {
      const parts = jwt.split('.');

      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        decodeURIComponent(
          atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        ),
      );

      return payload.email || null;
    } catch {
      return null;
    }
  }, [jwt]);

  useEffect(() => {
    const loadData = async () => {
      const loadedDarkMode = await AsyncStorage.getItem('darkMode');

      if (loadedDarkMode !== null) {
        setIsDarkModeState(loadedDarkMode === 'true');
      } else {
        setIsDarkModeState(true);
      }
      setIsThemeLoaded(true);
      const loadedCredentials = await loadCredentials();
      const loadedJWT = await loadJWT();
      const loadedBiometricEnabled = await loadBiometricEnabled();
      const loadedAppLocked = await loadAppLocked();
      const loadedFCMToken = await loadFCMToken();
      const loadedAuditLogs = await loadAuditLogs();

      if (loadedCredentials) {
        setCredentialsState(loadedCredentials);
      }
      if (loadedJWT) {
        setJWTState(loadedJWT);
        apiService.setJWT(loadedJWT);
      }
      if (loadedFCMToken) {
        setFCMTokenState(loadedFCMToken);
      }
      if (loadedAuditLogs && loadedAuditLogs.length > 0) {
        setAuditLogs(loadedAuditLogs);
      }
      const availability = await biometricService.checkAvailability();

      setBiometricAvailable(availability.available);
      setBiometricEnabledState(loadedBiometricEnabled);
      if (loadedBiometricEnabled && loadedAppLocked) {
        setIsAppLocked(true);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
      try {
        await pushNotificationService.initialize();
        const token = await pushNotificationService.getToken();

        if (token && token !== loadedFCMToken) {
          setFCMTokenState(token);
          await saveFCMToken(token);
          if (loadedCredentials?.did) {
            await registerFCMToken(token);
          }
        }
      } catch (_error) {
        console.error('Failed to initialize push notifications:', _error);
      }
    };

    loadData();
  }, [registerFCMToken]);
  useEffect(() => {
    const unsubscribeForeground = pushNotificationService.onNotificationReceived(
      (notification: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('Foreground notification:', notification);
        if (notification.notification) {
          Alert.alert(notification.notification.title || 'Notification', notification.notification.body || '', [
            { text: 'OK' },
          ]);
        }
      },
    );
    const unsubscribeOpened = pushNotificationService.onNotificationOpened(
      (notification: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('Notification opened:', notification);
        if (notification.data?.screen === 'Wallet') {
          console.log('Navigate to Wallet screen');
        }
      },
    );
    const unsubscribeTokenRefresh = pushNotificationService.onTokenRefresh(async (newToken: string) => {
      console.log('Token refreshed:', newToken);
      setFCMTokenState(newToken);
      await saveFCMToken(newToken);
      if (credentials?.did) {
        await registerFCMToken(newToken);
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
    };
  }, [credentials, registerFCMToken]);
  const setCredentials = async (newCredentials: UserCredentials | null) => {
    setCredentialsState(newCredentials);
    if (newCredentials) {
      await saveCredentials(newCredentials);
    }
  };
  const setJWT = async (newJWT: string | null) => {
    console.log('[AppContext] Setting JWT:', newJWT ? 'present' : 'null');
    setJWTState(newJWT);
    setIsAuthenticated(!!newJWT);
    if (newJWT) {
      await saveJWT(newJWT);
      apiService.setJWT(newJWT);
    } else {
      apiService.setJWT(null);
    }
  };
  const addAuditLog = async (log: AuditLog) => {
    const newLogs = [...auditLogs, log];

    setAuditLogs(newLogs);
    await saveAuditLogs(newLogs);
  };
  const clearCredentials = async () => {
    console.log('[AppContext] Clearing credentials...');
    setCredentialsState(null);
    setJWTState(null);
    setAuditLogs([]);
    setIsAuthenticated(false);
    setBiometricEnabledState(false);
    await clearStorage();
    apiService.setJWT(null);
    console.log('[AppContext] Credentials cleared successfully');
  };
  const logout = async () => {
    console.log('[AppContext] Logout initiated');
    await clearCredentials();
    console.log('[AppContext] Logout completed');
  };
  const setBiometricEnabled = async (enabled: boolean) => {
    setBiometricEnabledState(enabled);
    await saveBiometricEnabled(enabled);
    if (enabled) {
      await biometricService.createKeys();
    } else {
      await biometricService.deleteKeys();
    }
  };
  const lockApp = async () => {
    if (biometricEnabled) {
      setIsAppLocked(true);
      setIsAuthenticated(false);
      await saveAppLocked(true);
    }
  };
  const unlockApp = async (): Promise<boolean> => {
    if (!biometricEnabled) {
      setIsAuthenticated(true);

      return true;
    }
    const result = await biometricService.authenticate('Unlock app');

    if (result.success) {
      setIsAppLocked(false);
      setIsAuthenticated(true);
      await saveAppLocked(false);

      return true;
    }

    return false;
  };
  const authenticateWithBiometric = async (promptMessage?: string): Promise<boolean> => {
    if (!biometricAvailable || !biometricEnabled) {
      return false;
    }
    const result = await biometricService.authenticate(promptMessage);

    return result.success;
  };
  const setFCMToken = (token: string | null) => {
    setFCMTokenState(token);
    if (token) {
      saveFCMToken(token);
    }
  };
  const setDarkMode = async (enabled: boolean) => {
    setIsDarkModeState(enabled);
    await AsyncStorage.setItem('darkMode', enabled.toString());
  };
  const value: AppContextValue = {
    credentials,
    jwt,
    auditLogs,
    biometricEnabled,
    biometricAvailable,
    isAppLocked,
    isAuthenticated,
    userEmail,
    fcmToken,
    isDarkMode,
    isThemeLoaded,
    setCredentials,
    setJWT,
    addAuditLog,
    clearCredentials,
    logout,
    setBiometricEnabled,
    lockApp,
    unlockApp,
    authenticateWithBiometric,
    setFCMToken,
    registerFCMToken,
    setDarkMode,
  };

  if (!isThemeLoaded) {
    return null;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
};
