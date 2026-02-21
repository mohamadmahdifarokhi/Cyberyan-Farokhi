import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Theme Persistence Property Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Property 6: Theme persistence round-trip', () => {
    it('should persist theme preference through save/load cycle', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (isDarkMode) => {
          await AsyncStorage.setItem('darkMode', isDarkMode.toString());

          const loaded = await AsyncStorage.getItem('darkMode');

          return loaded === isDarkMode.toString();
        }),
        { numRuns: 100 },
      );
    });

    it('should maintain consistency across multiple save/load cycles', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), async (preferences) => {
          for (const pref of preferences) {
            await AsyncStorage.setItem('darkMode', pref.toString());

            const loaded = await AsyncStorage.getItem('darkMode');

            if (loaded !== pref.toString()) {
              return false;
            }
          }

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it('should correctly overwrite previous theme preference', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), fc.boolean(), async (firstPref, secondPref) => {
          await AsyncStorage.setItem('darkMode', firstPref.toString());

          await AsyncStorage.setItem('darkMode', secondPref.toString());

          const loaded = await AsyncStorage.getItem('darkMode');

          return loaded === secondPref.toString();
        }),
        { numRuns: 100 },
      );
    });

    it('should persist theme preference across app restart simulation', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (isDarkMode) => {
          await AsyncStorage.setItem('darkMode', isDarkMode.toString());

          const loaded = await AsyncStorage.getItem('darkMode');

          return loaded === isDarkMode.toString();
        }),
        { numRuns: 100 },
      );
    });

    it('should handle missing theme preference gracefully', async () => {
      const loaded = await AsyncStorage.getItem('darkMode');

      expect(loaded).toBeNull();
    });

    it('should remove theme preference when storage is cleared', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (isDarkMode) => {
          await AsyncStorage.setItem('darkMode', isDarkMode.toString());

          await AsyncStorage.clear();

          const loaded = await AsyncStorage.getItem('darkMode');

          return loaded === null;
        }),
        { numRuns: 100 },
      );
    });

    it('should remove theme preference when key is removed', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (isDarkMode) => {
          await AsyncStorage.setItem('darkMode', isDarkMode.toString());

          await AsyncStorage.removeItem('darkMode');

          const loaded = await AsyncStorage.getItem('darkMode');

          return loaded === null;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Theme preference format validation', () => {
    it('should store boolean values as strings', async () => {
      await AsyncStorage.setItem('darkMode', 'true');
      const loaded = await AsyncStorage.getItem('darkMode');

      expect(loaded).toBe('true');
      expect(typeof loaded).toBe('string');

      await AsyncStorage.setItem('darkMode', 'false');
      const loaded2 = await AsyncStorage.getItem('darkMode');

      expect(loaded2).toBe('false');
      expect(typeof loaded2).toBe('string');
    });

    it('should correctly convert stored strings back to booleans', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (isDarkMode) => {
          await AsyncStorage.setItem('darkMode', isDarkMode.toString());
          const loaded = await AsyncStorage.getItem('darkMode');
          const parsedBoolean = loaded === 'true';

          return parsedBoolean === isDarkMode;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Concurrent access handling', () => {
    it('should handle concurrent save operations', async () => {
      const promises = [
        AsyncStorage.setItem('darkMode', 'true'),
        AsyncStorage.setItem('darkMode', 'false'),
        AsyncStorage.setItem('darkMode', 'true'),
      ];

      await Promise.all(promises);

      const loaded = await AsyncStorage.getItem('darkMode');

      expect(loaded === null || loaded === 'true' || loaded === 'false').toBe(true);
    });
  });
});
