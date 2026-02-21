import * as fc from 'fast-check';
import { validateName, validateEmail } from '../utils/validation';

describe('Validation Utils', () => {
  describe('Property 1: Name validation accepts valid characters', () => {
    it('should accept alphanumeric characters and spaces', () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[a-zA-Z0-9\s]+$/), (name) => {
          if (name.trim().length === 0) return true;

          return validateName(name) === true;
        }),
      );
    });

    it('should reject names with special characters', () => {
      const invalidNames = ['test@name', 'name!', 'user#123', 'test$'];

      invalidNames.forEach((name) => {
        expect(validateName(name)).toBe(false);
      });
    });
  });

  describe('Property 2: Email validation correctly identifies format', () => {
    it('should accept valid email formats', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          return validateEmail(email) === true;
        }),
      );
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'no@domain'];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });
});
