import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

export interface BiometricAvailability {
  available: boolean;
  biometryType: (typeof BiometryTypes)[keyof typeof BiometryTypes] | null;
  error?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

class BiometricService {
  private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  async checkAvailability(): Promise<BiometricAvailability> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();

      return {
        available,
        biometryType: biometryType as (typeof BiometryTypes)[keyof typeof BiometryTypes] | null,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);

      return {
        available: false,
        biometryType: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<BiometricAuthResult> {
    try {
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
      });

      return {
        success,
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async createKeys(): Promise<{ publicKey: string } | null> {
    try {
      const { publicKey } = await this.rnBiometrics.createKeys();

      return { publicKey };
    } catch (error) {
      console.error('Error creating biometric keys:', error);

      return null;
    }
  }

  async deleteKeys(): Promise<boolean> {
    try {
      const { keysDeleted } = await this.rnBiometrics.deleteKeys();

      return keysDeleted;
    } catch (error) {
      console.error('Error deleting biometric keys:', error);

      return false;
    }
  }

  async biometricKeysExist(): Promise<boolean> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();

      return keysExist;
    } catch (error) {
      console.error('Error checking biometric keys:', error);

      return false;
    }
  }
}

export const biometricService = new BiometricService();
