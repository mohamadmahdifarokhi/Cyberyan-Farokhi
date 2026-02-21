import * as fc from 'fast-check';
import { didService } from '../services/didService';

describe('DIDService', () => {
  describe('Property 5: Registration generates unique DID', () => {
    it('should generate unique DIDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (count) => {
          const dids = new Set<string>();
          for (let i = 0; i < count; i++) {
            dids.add(didService.generateDID());
          }
          return dids.size === count;
        }),
      );
    });
  });

  describe('Property 17: DID format is realistic', () => {
    it('should generate DIDs with correct format', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const did = didService.generateDID();
          const didPattern = /^did:example:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
          return didPattern.test(did);
        }),
        { numRuns: 100 },
      );
    });
  });
});
