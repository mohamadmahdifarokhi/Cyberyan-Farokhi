import { BiometryTypes } from 'react-native-biometrics';

const mockIsSensorAvailable = jest.fn();
const mockSimplePrompt = jest.fn();
const mockCreateKeys = jest.fn();
const mockDeleteKeys = jest.fn();
const mockBiometricKeysExist = jest.fn();

jest.mock('react-native-biometrics', () => {
  const mockConstructor = jest.fn().mockImplementation(() => ({
    isSensorAvailable: mockIsSensorAvailable,
    simplePrompt: mockSimplePrompt,
    createKeys: mockCreateKeys,
    deleteKeys: mockDeleteKeys,
    biometricKeysExist: mockBiometricKeysExist,
  }));

  return {
    BiometryTypes: {
      TouchID: 'TouchID',
      FaceID: 'FaceID',
      Biometrics: 'Biometrics',
    },
    default: mockConstructor,
    __esModule: true,
  };
});

import { biometricService } from '../services/biometric';

describe('Biometric Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return available true when biometrics are available', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: true,
        biometryType: BiometryTypes.TouchID,
      });

      const result = await biometricService.checkAvailability();

      expect(result.available).toBe(true);
      expect(result.biometryType).toBe(BiometryTypes.TouchID);
      expect(result.error).toBeUndefined();
    });

    it('should return available false when biometrics are not available', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        biometryType: null,
      });

      const result = await biometricService.checkAvailability();

      expect(result.available).toBe(false);
      expect(result.biometryType).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Sensor not available';

      mockIsSensorAvailable.mockRejectedValue(new Error(errorMessage));

      const result = await biometricService.checkAvailability();

      expect(result.available).toBe(false);
      expect(result.biometryType).toBeNull();
      expect(result.error).toBe(errorMessage);
    });

    it('should detect TouchID', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: true,
        biometryType: BiometryTypes.TouchID,
      });

      const result = await biometricService.checkAvailability();

      expect(result.biometryType).toBe(BiometryTypes.TouchID);
    });

    it('should detect FaceID', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: true,
        biometryType: BiometryTypes.FaceID,
      });

      const result = await biometricService.checkAvailability();

      expect(result.biometryType).toBe(BiometryTypes.FaceID);
    });
  });

  describe('authenticate', () => {
    it('should return success true when authentication succeeds', async () => {
      mockSimplePrompt.mockResolvedValue({
        success: true,
      });

      const result = await biometricService.authenticate('Test prompt');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSimplePrompt).toHaveBeenCalledWith({
        promptMessage: 'Test prompt',
        cancelButtonText: 'Cancel',
      });
    });

    it('should return success false when authentication fails', async () => {
      mockSimplePrompt.mockResolvedValue({
        success: false,
      });

      const result = await biometricService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      const errorMessage = 'Authentication cancelled';

      mockSimplePrompt.mockRejectedValue(new Error(errorMessage));

      const result = await biometricService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should use default prompt message when none provided', async () => {
      mockSimplePrompt.mockResolvedValue({
        success: true,
      });

      await biometricService.authenticate();

      expect(mockSimplePrompt).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to continue',
        cancelButtonText: 'Cancel',
      });
    });
  });

  describe('createKeys', () => {
    it('should create biometric keys successfully', async () => {
      const publicKey = 'test-public-key';

      mockCreateKeys.mockResolvedValue({
        publicKey,
      });

      const result = await biometricService.createKeys();

      expect(result).toEqual({ publicKey });
      expect(mockCreateKeys).toHaveBeenCalled();
    });

    it('should handle key creation errors', async () => {
      mockCreateKeys.mockRejectedValue(new Error('Key creation failed'));

      const result = await biometricService.createKeys();

      expect(result).toBeNull();
    });
  });

  describe('deleteKeys', () => {
    it('should delete biometric keys successfully', async () => {
      mockDeleteKeys.mockResolvedValue({
        keysDeleted: true,
      });

      const result = await biometricService.deleteKeys();

      expect(result).toBe(true);
      expect(mockDeleteKeys).toHaveBeenCalled();
    });

    it('should return false when key deletion fails', async () => {
      mockDeleteKeys.mockResolvedValue({
        keysDeleted: false,
      });

      const result = await biometricService.deleteKeys();

      expect(result).toBe(false);
    });

    it('should handle key deletion errors', async () => {
      mockDeleteKeys.mockRejectedValue(new Error('Deletion failed'));

      const result = await biometricService.deleteKeys();

      expect(result).toBe(false);
    });
  });

  describe('biometricKeysExist', () => {
    it('should return true when keys exist', async () => {
      mockBiometricKeysExist.mockResolvedValue({
        keysExist: true,
      });

      const result = await biometricService.biometricKeysExist();

      expect(result).toBe(true);
      expect(mockBiometricKeysExist).toHaveBeenCalled();
    });

    it('should return false when keys do not exist', async () => {
      mockBiometricKeysExist.mockResolvedValue({
        keysExist: false,
      });

      const result = await biometricService.biometricKeysExist();

      expect(result).toBe(false);
    });

    it('should handle errors when checking key existence', async () => {
      mockBiometricKeysExist.mockRejectedValue(new Error('Check failed'));

      const result = await biometricService.biometricKeysExist();

      expect(result).toBe(false);
    });
  });

  describe('Fallback mechanism', () => {
    it('should allow fallback to password when biometric fails', async () => {
      mockSimplePrompt.mockRejectedValue(new Error('Biometric failed'));

      const biometricResult = await biometricService.authenticate();

      expect(biometricResult.success).toBe(false);
      expect(biometricResult.error).toBe('Biometric failed');
    });
  });
});
