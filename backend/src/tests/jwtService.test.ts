import * as fc from 'fast-check';
import { jwtService } from '../services/jwtService';

describe('JWTService', () => {
  describe('Property 13: Successful registration generates JWT', () => {
    it('should generate valid JWT tokens', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const jwt = jwtService.generateJWT(email);
          return typeof jwt === 'string' && jwt.split('.').length === 3;
        }),
      );
    });
  });

  describe('Property 14: JWT contains user claims', () => {
    it('should include email and sub claims in JWT', () => {
      fc.assert(
        fc.property(fc.emailAddress(), fc.string({ minLength: 10, maxLength: 50 }), (email, did) => {
          const jwt = jwtService.generateJWT(email, did);
          const decoded = jwtService.verifyJWT(jwt);

          return decoded.email === email && decoded.sub === did && typeof decoded.iat === 'number';
        }),
      );
    });
  });

  describe('Enhanced JWT Service Unit Tests', () => {
    it('should include userId and email in JWT', () => {
      const email = 'test@example.com';
      const did = 'did:example:123';
      const userId = 'user123';

      const jwt = jwtService.generateJWT(email, did, userId);
      const decoded = jwtService.verifyJWT(jwt);

      expect(decoded.email).toBe(email);
      expect(decoded.sub).toBe(userId);
      expect(decoded.did).toBe(did);
    });

    it('should return correct payload on verification', () => {
      const email = 'test@example.com';
      const jwt = jwtService.generateJWT(email);
      const decoded = jwtService.verifyJWT(jwt);

      expect(decoded).toHaveProperty('email', email);
      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('iat');
    });

    it('should fail verification for invalid tokens', () => {
      expect(() => {
        jwtService.verifyJWT('invalid.token.here');
      }).toThrow('Invalid or expired token');
    });

    it('should fail verification for malformed tokens', () => {
      expect(() => {
        jwtService.verifyJWT('not-a-jwt');
      }).toThrow('Invalid or expired token');
    });
  });
});
