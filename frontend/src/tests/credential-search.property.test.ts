import * as fc from 'fast-check';
import { UserCredentials } from '../types';

const filterCredentials = (credentials: UserCredentials | null, searchQuery: string): UserCredentials | null => {
  if (!credentials || !searchQuery.trim()) {
    return credentials;
  }

  const query = searchQuery.toLowerCase();
  const matchesSearch =
    credentials.did.toLowerCase().includes(query) ||
    credentials.vc.credentialSubject.name.toLowerCase().includes(query) ||
    credentials.vc.credentialSubject.email.toLowerCase().includes(query);

  return matchesSearch ? credentials : null;
};

const credentialsArbitrary = fc.record({
  did: fc.string({ minLength: 10, maxLength: 100 }).map((s) => `did:example:${s}`),
  vc: fc.record({
    '@context': fc.constant(['https://www.w3.org/2018/credentials/v1'] as string[]),
    type: fc.constant(['VerifiableCredential'] as string[]),
    issuer: fc.constant('did:example:issuer'),
    issuanceDate: fc.constant(new Date('2024-01-01T00:00:00.000Z').toISOString()),
    credentialSubject: fc.record({
      id: fc.string({ minLength: 10, maxLength: 100 }).map((s) => `did:example:${s}`),
      name: fc.string({ minLength: 3, maxLength: 50 }),
      email: fc.emailAddress(),
    }),
  }),
});

describe('Property 12: Credential search functionality', () => {
  it('should return null when search query does not match any credential field', () => {
    fc.assert(
      fc.property(credentialsArbitrary, fc.string({ minLength: 1, maxLength: 20 }), (credentials, searchQuery) => {
        const unmatchableQuery = '###UNMATCHABLE###' + searchQuery;

        const result = filterCredentials(credentials, unmatchableQuery);

        if (
          !credentials.did.toLowerCase().includes(unmatchableQuery.toLowerCase()) &&
          !credentials.vc.credentialSubject.name.toLowerCase().includes(unmatchableQuery.toLowerCase()) &&
          !credentials.vc.credentialSubject.email.toLowerCase().includes(unmatchableQuery.toLowerCase())
        ) {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should return credentials when search query matches DID', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const didSubstring = credentials.did.substring(5, 15);

        const result = filterCredentials(credentials, didSubstring);

        expect(result).not.toBeNull();
        expect(result?.did).toBe(credentials.did);
      }),
      { numRuns: 100 },
    );
  });

  it('should return credentials when search query matches name', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const nameQuery = credentials.vc.credentialSubject.name;

        if (nameQuery.length > 0) {
          const result = filterCredentials(credentials, nameQuery);

          expect(result).not.toBeNull();
          expect(result?.vc.credentialSubject.name).toBe(credentials.vc.credentialSubject.name);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should return credentials when search query matches email', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const emailQuery = credentials.vc.credentialSubject.email;

        const result = filterCredentials(credentials, emailQuery);

        expect(result).not.toBeNull();
        expect(result?.vc.credentialSubject.email).toBe(credentials.vc.credentialSubject.email);
      }),
      { numRuns: 100 },
    );
  });

  it('should be case-insensitive when matching search queries', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const name = credentials.vc.credentialSubject.name;

        if (name.length > 0) {
          const upperQuery = name.toUpperCase();
          const resultUpper = filterCredentials(credentials, upperQuery);

          const lowerQuery = name.toLowerCase();
          const resultLower = filterCredentials(credentials, lowerQuery);

          expect(resultUpper).not.toBeNull();
          expect(resultLower).not.toBeNull();
          expect(resultUpper?.did).toBe(resultLower?.did);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should return original credentials when search query is empty or whitespace', () => {
    fc.assert(
      fc.property(credentialsArbitrary, fc.constantFrom('', '   ', '\t', '\n', '  \t  '), (credentials, emptyQuery) => {
        const result = filterCredentials(credentials, emptyQuery);

        expect(result).not.toBeNull();
        expect(result?.did).toBe(credentials.did);
      }),
      { numRuns: 100 },
    );
  });

  it('should handle partial matches in any credential field', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const name = credentials.vc.credentialSubject.name;

        if (name.length > 3) {
          const partialQuery = name.substring(1, name.length - 1);
          const result = filterCredentials(credentials, partialQuery);

          expect(result).not.toBeNull();
          expect(result?.vc.credentialSubject.name).toContain(partialQuery);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should return null for credentials when no fields match the query', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const nonMatchingQuery = 'ZZZZZ_NONEXISTENT_QUERY_12345';

        const result = filterCredentials(credentials, nonMatchingQuery);

        const matchesDid = credentials.did.toLowerCase().includes(nonMatchingQuery.toLowerCase());
        const matchesName = credentials.vc.credentialSubject.name
          .toLowerCase()
          .includes(nonMatchingQuery.toLowerCase());
        const matchesEmail = credentials.vc.credentialSubject.email
          .toLowerCase()
          .includes(nonMatchingQuery.toLowerCase());

        if (!matchesDid && !matchesName && !matchesEmail) {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should handle special characters in search queries', () => {
    fc.assert(
      fc.property(credentialsArbitrary, fc.constantFrom('@', '.', '-', '_', ':', '/'), (credentials, specialChar) => {
        const result = filterCredentials(credentials, specialChar);

        const matchesDid = credentials.did.includes(specialChar);
        const matchesName = credentials.vc.credentialSubject.name.includes(specialChar);
        const matchesEmail = credentials.vc.credentialSubject.email.includes(specialChar);

        if (matchesDid || matchesName || matchesEmail) {
          expect(result).not.toBeNull();
        } else {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should maintain credential integrity when filtering', () => {
    fc.assert(
      fc.property(credentialsArbitrary, fc.string({ minLength: 1, maxLength: 20 }), (credentials, searchQuery) => {
        const result = filterCredentials(credentials, searchQuery);

        if (result !== null) {
          expect(result.did).toBe(credentials.did);
          expect(result.vc.credentialSubject.name).toBe(credentials.vc.credentialSubject.name);
          expect(result.vc.credentialSubject.email).toBe(credentials.vc.credentialSubject.email);
          expect(result.vc.issuer).toBe(credentials.vc.issuer);
        }
      }),
      { numRuns: 100 },
    );
  });
});
