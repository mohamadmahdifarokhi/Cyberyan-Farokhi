import * as fc from 'fast-check';
import { authService } from '../services/authService';

describe('Auth Service Property Tests', () => {
  describe('Property 1: Password validation consistency', () => {
    it('should consistently validate password length requirements', () => {
      fc.assert(
        fc.property(fc.string(), (password) => {
          const meetsMinLength = password.length >= 8;
          const validation = authService.validatePassword(password);

          if (!meetsMinLength) {
            expect(validation.valid).toBe(false);
            expect(validation.error).toBeDefined();
          } else {
            expect(validation.valid).toBe(true);
            expect(validation.error).toBeUndefined();
          }
        }),
        { numRuns: 100 },
      );
    });
  });
});
