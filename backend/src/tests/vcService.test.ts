import * as fc from 'fast-check';
import { vcService } from '../services/vcService';
import { didService } from '../services/didService';

describe('VCService', () => {
  describe('Property 6: DID and VC are linked', () => {
    it('should link DID to VC credentialSubject.id', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.emailAddress(), (name, email) => {
          const did = didService.generateDID();
          const vc = vcService.createVC(did, name, email);
          return vc.credentialSubject.id === did;
        }),
      );
    });
  });

  describe('Property 18: VC fields contain realistic data', () => {
    it('should populate VC with provided data', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.emailAddress(), (name, email) => {
          const did = didService.generateDID();
          const vc = vcService.createVC(did, name, email);

          return (
            vc.credentialSubject.name === name &&
            vc.credentialSubject.email === email &&
            vc['@context'].length > 0 &&
            vc.type.includes('VerifiableCredential') &&
            typeof vc.issuanceDate === 'string' &&
            vc.issuer === 'did:example:issuer'
          );
        }),
      );
    });
  });
});
