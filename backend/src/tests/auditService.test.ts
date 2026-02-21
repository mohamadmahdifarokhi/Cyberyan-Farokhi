import * as fc from 'fast-check';
import { auditService } from '../services/auditService';

describe('AuditService', () => {
  describe('Property 11: Credential issuance generates SHA-256 hash', () => {
    it('should generate 64-character hexadecimal SHA-256 hash', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.string({ minLength: 5, maxLength: 30 }),
          fc.date(),
          (did, operation, date) => {
            const timestamp = date.toISOString();
            const hash = auditService.generateAuditHash(did, operation, timestamp);

            const sha256Pattern = /^[a-f0-9]{64}$/;
            return sha256Pattern.test(hash);
          },
        ),
      );
    });
  });

  it('should generate different hashes for different inputs', () => {
    const hash1 = auditService.generateAuditHash('did1', 'op1', '2024-01-01');
    const hash2 = auditService.generateAuditHash('did2', 'op1', '2024-01-01');

    expect(hash1).not.toBe(hash2);
  });
});
