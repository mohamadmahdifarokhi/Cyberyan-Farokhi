import * as fc from 'fast-check';
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

describe('Property 8: Biometric authentication availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly detect biometric availability for any device state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({
            available: fc.constant(true),
            biometryType: fc.constantFrom(BiometryTypes.TouchID, BiometryTypes.FaceID, BiometryTypes.Biometrics),
          }),

          fc.record({
            available: fc.constant(false),
            biometryType: fc.constant(null),
          }),
        ),
        async (deviceState) => {
          mockIsSensorAvailable.mockResolvedValue({
            available: deviceState.available,
            biometryType: deviceState.biometryType,
          });

          const result = await biometricService.checkAvailability();

          expect(result.available).toBe(deviceState.available);
          expect(result.biometryType).toBe(deviceState.biometryType);
          expect(result.error).toBeUndefined();

          if (deviceState.available) {
            expect(deviceState.biometryType).not.toBeNull();
            expect(result.biometryType).not.toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle errors gracefully for any error condition', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
        mockIsSensorAvailable.mockRejectedValue(new Error(errorMessage));

        const result = await biometricService.checkAvailability();

        expect(result.available).toBe(false);
        expect(result.biometryType).toBeNull();
        expect(result.error).toBeDefined();
        expect(result.error).toBe(errorMessage);
      }),
      { numRuns: 100 },
    );
  });

  it('should return consistent results for repeated availability checks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({
            available: fc.constant(true),
            biometryType: fc.constantFrom(BiometryTypes.TouchID, BiometryTypes.FaceID, BiometryTypes.Biometrics),
          }),

          fc.record({
            available: fc.constant(false),
            biometryType: fc.constant(null),
          }),
        ),
        async (deviceState) => {
          mockIsSensorAvailable.mockResolvedValue({
            available: deviceState.available,
            biometryType: deviceState.biometryType,
          });

          const result1 = await biometricService.checkAvailability();
          const result2 = await biometricService.checkAvailability();
          const result3 = await biometricService.checkAvailability();

          expect(result1.available).toBe(result2.available);
          expect(result2.available).toBe(result3.available);
          expect(result1.biometryType).toBe(result2.biometryType);
          expect(result2.biometryType).toBe(result3.biometryType);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should correctly identify when biometric authentication is not available', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant({ available: false, biometryType: null }), async (deviceState) => {
        mockIsSensorAvailable.mockResolvedValue(deviceState);

        const result = await biometricService.checkAvailability();

        expect(result.available).toBe(false);
        expect(result.biometryType).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('should validate biometry type is one of the supported types when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(BiometryTypes.TouchID, BiometryTypes.FaceID, BiometryTypes.Biometrics),
        async (biometryType) => {
          mockIsSensorAvailable.mockResolvedValue({
            available: true,
            biometryType: biometryType,
          });

          const result = await biometricService.checkAvailability();

          expect(result.available).toBe(true);
          expect([BiometryTypes.TouchID, BiometryTypes.FaceID, BiometryTypes.Biometrics]).toContain(
            result.biometryType,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
