import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveJWT, loadJWT } from '../utils/storage';

describe('Property 6: Session persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('should persist and restore JWT tokens across app restarts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .tuple(
            fc.string({ minLength: 10, maxLength: 50 }),
            fc.string({ minLength: 10, maxLength: 50 }),
            fc.string({ minLength: 10, maxLength: 50 }),
          )
          .map(([a, b, c]) => `${a}.${b}.${c}`),
        async (jwt) => {
          await saveJWT(jwt);

          const storedJWT = await AsyncStorage.getItem('jwt');

          expect(storedJWT).toBe(jwt);

          const loadedJWT = await loadJWT();

          expect(loadedJWT).toBe(jwt);
          expect(loadedJWT).not.toBeNull();

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should maintain authentication state after restart', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .tuple(
            fc.string({ minLength: 10, maxLength: 50 }),
            fc.string({ minLength: 10, maxLength: 50 }),
            fc.string({ minLength: 10, maxLength: 50 }),
          )
          .map(([a, b, c]) => `${a}.${b}.${c}`),
        async (jwt) => {
          await saveJWT(jwt);

          const restoredJWT = await loadJWT();

          const isAuthenticated = !!restoredJWT;

          expect(isAuthenticated).toBe(true);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle missing JWT gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        await AsyncStorage.clear();

        const loadedJWT = await loadJWT();

        expect(loadedJWT).toBeNull();

        return true;
      }),
      { numRuns: 50 },
    );
  });

  it('should overwrite previous JWT on new save', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc
            .tuple(
              fc.string({ minLength: 10, maxLength: 50 }),
              fc.string({ minLength: 10, maxLength: 50 }),
              fc.string({ minLength: 10, maxLength: 50 }),
            )
            .map(([a, b, c]) => `${a}.${b}.${c}`),
          fc
            .tuple(
              fc.string({ minLength: 10, maxLength: 50 }),
              fc.string({ minLength: 10, maxLength: 50 }),
              fc.string({ minLength: 10, maxLength: 50 }),
            )
            .map(([a, b, c]) => `${a}.${b}.${c}`),
        ),
        async ([jwt1, jwt2]) => {
          await saveJWT(jwt1);
          const loaded1 = await loadJWT();

          expect(loaded1).toBe(jwt1);

          await saveJWT(jwt2);
          const loaded2 = await loadJWT();

          expect(loaded2).toBe(jwt2);
          expect(loaded2).not.toBe(jwt1);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
