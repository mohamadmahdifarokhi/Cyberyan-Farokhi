import * as fc from 'fast-check';
import { SecurityService } from '../services/security.service';

describe('SecurityService - Property-Based Tests', () => {
  let securityService: SecurityService;

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!';
    securityService = new SecurityService();
  });

  describe('Property 3: Encryption at rest', () => {
    it('should encrypt and decrypt strings to restore original value', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 1000 }), (originalData) => {
          const encrypted = securityService.encrypt(originalData);

          const isDifferent = encrypted !== originalData;

          const decrypted = securityService.decrypt(encrypted);

          const isRestored = decrypted === originalData;

          return isDifferent && isRestored;
        }),
        { numRuns: 100 },
      );
    });

    it('should handle special characters in encryption', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '\n', '\t', '\\', '"', "'"),
          (str, specialChar) => {
            const data = str + specialChar;
            const encrypted = securityService.encrypt(data);
            const decrypted = securityService.decrypt(encrypted);
            return decrypted === data;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should produce different encrypted values for same input (due to IV)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 100 }), (data) => {
          const encrypted1 = securityService.encrypt(data);
          const encrypted2 = securityService.encrypt(data);

          const areDifferent = encrypted1 !== encrypted2;

          const decrypted1 = securityService.decrypt(encrypted1);
          const decrypted2 = securityService.decrypt(encrypted2);
          const bothCorrect = decrypted1 === data && decrypted2 === data;

          return areDifferent && bothCorrect;
        }),
        { numRuns: 50 },
      );
    });

    it('should handle empty strings', () => {
      const encrypted = securityService.encrypt('');
      const decrypted = securityService.decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle very long strings', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1000, maxLength: 5000 }), (longString) => {
          const encrypted = securityService.encrypt(longString);
          const decrypted = securityService.decrypt(encrypted);
          return decrypted === longString;
        }),
        { numRuns: 20 },
      );
    });

    it('should handle unicode characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 200 }), (unicodeStr) => {
          const encrypted = securityService.encrypt(unicodeStr);
          const decrypted = securityService.decrypt(encrypted);
          return decrypted === unicodeStr;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 6: Input sanitization', () => {
    it('should remove dangerous characters from input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('<', '>', '{', '}', '$'),
          (str, dangerousChar) => {
            const input = str + dangerousChar + str;
            const sanitized = securityService.sanitizeInput(input);

            return !sanitized.includes(dangerousChar);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should escape HTML special characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('<', '>', '&', '"', "'", '/'),
          (str, htmlChar) => {
            const input = str + htmlChar;
            const sanitized = securityService.sanitizeHTML(input);

            return !sanitized.includes(htmlChar) || htmlChar === str[0];
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should detect malicious patterns', () => {
      const maliciousInputs = [
        '$where: function() { return true; }',
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        'onerror=alert(1)',
        'SELECT * FROM users',
        'DROP TABLE users',
        '$ne: null',
      ];

      maliciousInputs.forEach((input) => {
        const isSafe = securityService.isSafeInput(input);
        expect(isSafe).toBe(false);
      });
    });

    it('should allow safe inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => /^[a-zA-Z0-9\s.,!?-]+$/.test(s)),
          (safeInput) => {
            return securityService.isSafeInput(safeInput);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords to different values', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 8, maxLength: 50 }), async (password) => {
          const hash1 = await securityService.hashPassword(password);
          const hash2 = await securityService.hashPassword(password);

          const areDifferent = hash1 !== hash2;

          const match1 = await securityService.comparePassword(password, hash1);
          const match2 = await securityService.comparePassword(password, hash2);

          return areDifferent && match1 && match2;
        }),
        { numRuns: 20 }, // Fewer runs because bcrypt is slow
      );
    });

    it('should not match wrong passwords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password1, password2) => {
            if (password1 === password2) return true;

            const hash = await securityService.hashPassword(password1);
            const match = await securityService.comparePassword(password2, hash);

            return !match;
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Validation', () => {
    it('should validate correct email formats', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          return securityService.validateEmail(email);
        }),
        { numRuns: 100 },
      );
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = ['notanemail', '@example.com', 'user@', 'user @example.com', 'user@.com', ''];

      invalidEmails.forEach((email) => {
        expect(securityService.validateEmail(email)).toBe(false);
      });
    });

    it('should validate DID format', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('example', 'web', 'key', 'ethr'),
          fc.string({ minLength: 10, maxLength: 50 }).map((s) => s.replace(/[^a-zA-Z0-9._-]/g, '')),
          (method, identifier) => {
            if (identifier.length === 0) return true; // Skip empty identifiers
            const did = `did:${method}:${identifier}`;
            return securityService.validateDID(did);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should validate string length', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5, maxLength: 10 }), (str) => {
          return securityService.validateLength(str, 5, 10);
        }),
        { numRuns: 100 },
      );
    });

    it('should reject strings outside length bounds', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string({ minLength: 0, maxLength: 4 }), fc.string({ minLength: 11, maxLength: 100 })),
          (str) => {
            return !securityService.validateLength(str, 5, 10);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
