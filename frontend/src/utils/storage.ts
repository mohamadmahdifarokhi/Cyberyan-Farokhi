import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCredentials, AuditLog } from '../types';

const CREDENTIALS_KEY = '@vc_did_credentials';
const JWT_KEY = '@vc_did_jwt';
const BIOMETRIC_ENABLED_KEY = '@vc_did_biometric_enabled';
const APP_LOCKED_KEY = '@vc_did_app_locked';
const FCM_TOKEN_KEY = '@vc_did_fcm_token';
const AUDIT_LOGS_KEY = '@vc_did_audit_logs';

export const saveCredentials = async (credentials: UserCredentials): Promise<void> => {
  try {
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Error saving credentials:', error);
    throw error;
  }
};
export const loadCredentials = async (): Promise<UserCredentials | null> => {
  try {
    const data = await AsyncStorage.getItem(CREDENTIALS_KEY);

    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading credentials:', error);

    return null;
  }
};
export const saveJWT = async (jwt: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(JWT_KEY, jwt);
  } catch (error) {
    console.error('Error saving JWT:', error);
    throw error;
  }
};
export const loadJWT = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(JWT_KEY);
  } catch (error) {
    console.error('Error loading JWT:', error);

    return null;
  }
};
export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([CREDENTIALS_KEY, JWT_KEY, BIOMETRIC_ENABLED_KEY, APP_LOCKED_KEY, AUDIT_LOGS_KEY]);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};
export const saveBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error('Error saving biometric preference:', error);
    throw error;
  }
};
export const loadBiometricEnabled = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

    return data ? JSON.parse(data) : false;
  } catch (error) {
    console.error('Error loading biometric preference:', error);

    return false;
  }
};
export const saveAppLocked = async (locked: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(APP_LOCKED_KEY, JSON.stringify(locked));
  } catch (error) {
    console.error('Error saving app lock state:', error);
    throw error;
  }
};
export const loadAppLocked = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(APP_LOCKED_KEY);

    return data ? JSON.parse(data) : false;
  } catch (error) {
    console.error('Error loading app lock state:', error);

    return false;
  }
};
export const saveFCMToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
};
export const loadFCMToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('Error loading FCM token:', error);

    return null;
  }
};
export const saveAuditLogs = async (logs: AuditLog[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving audit logs:', error);
    throw error;
  }
};
export const loadAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const data = await AsyncStorage.getItem(AUDIT_LOGS_KEY);

    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading audit logs:', error);

    return [];
  }
};
