import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearStorage } from '../utils/storage';

describe('Property 3: Logout completeness', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('should clear all authentication data on logout', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.string({ minLength: 10, maxLength: 50 }),
        fc.emailAddress(),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (jwt, did, _email, _name) => {
          await AsyncStorage.setItem('jwt', jwt);
          await AsyncStorage.setItem('credentials', JSON.stringify({ did, vc: {} }));
          await AsyncStorage.setItem(
            'auditLogs',
            JSON.stringify([{ hash: 'test', timestamp: new Date().toISOString(), operation: 'test' }]),
          );
          await AsyncStorage.setItem('biometricEnabled', 'true');

          const storedJWT = await AsyncStorage.getItem('jwt');
          const storedCredentials = await AsyncStorage.getItem('credentials');
          const storedAuditLogs = await AsyncStorage.getItem('auditLogs');
          const storedBiometric = await AsyncStorage.getItem('biometricEnabled');

          expect(storedJWT).toBe(jwt);
          expect(storedCredentials).toBeTruthy();
          expect(storedAuditLogs).toBeTruthy();
          expect(storedBiometric).toBe('true');

          await clearStorage();

          const clearedJWT = await AsyncStorage.getItem('jwt');
          const clearedCredentials = await AsyncStorage.getItem('credentials');
          const clearedAuditLogs = await AsyncStorage.getItem('auditLogs');
          const clearedBiometric = await AsyncStorage.getItem('biometricEnabled');

          expect(clearedJWT).toBeNull();
          expect(clearedCredentials).toBeNull();
          expect(clearedAuditLogs).toBeNull();
          expect(clearedBiometric).toBeNull();

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle logout when no data exists', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        await AsyncStorage.clear();

        await expect(clearStorage()).resolves.not.toThrow();

        const keys = await AsyncStorage.getAllKeys();

        expect(keys.length).toBe(0);

        return true;
      }),
      { numRuns: 50 },
    );
  });
});
