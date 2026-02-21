import { faker } from '@faker-js/faker';
import { VerifiableCredential } from '../types';

export class VCService {
  createVC(did: string, name: string, email: string): VerifiableCredential {
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
      type: ['VerifiableCredential', 'IdentityCredential'],
      issuer: 'did:example:issuer',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: did,
        name: name,
        email: email,
      },
    };
  }
}

export const vcService = new VCService();
