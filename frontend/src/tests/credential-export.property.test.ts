import * as fc from 'fast-check';

jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
  Platform: {
    OS: 'ios',
  },
}));

import { ExportService, ExportedCredential } from '../services/export';

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

describe('Property 13: Credential export integrity', () => {
  it('should generate a valid signature for any credential', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const signature = ExportService.generateSignature(credentials);

        expect(signature).toBeTruthy();
        expect(typeof signature).toBe('string');
        expect(signature.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('should generate the same signature for the same credential', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const signature1 = ExportService.generateSignature(credentials);
        const signature2 = ExportService.generateSignature(credentials);

        expect(signature1).toBe(signature2);
      }),
      { numRuns: 100 },
    );
  });

  it('should generate different signatures for different credentials', () => {
    fc.assert(
      fc.property(credentialsArbitrary, credentialsArbitrary, (credentials1, credentials2) => {
        if (JSON.stringify(credentials1) === JSON.stringify(credentials2)) {
          return;
        }

        const signature1 = ExportService.generateSignature(credentials1);
        const signature2 = ExportService.generateSignature(credentials2);

        expect(signature1).not.toBe(signature2);
      }),
      { numRuns: 100 },
    );
  });

  it('should export credential to valid JSON format', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const jsonString = ExportService.credentialToJSON(credentials);

        expect(() => JSON.parse(jsonString)).not.toThrow();

        const parsed = JSON.parse(jsonString);

        expect(parsed).toHaveProperty('did');
        expect(parsed).toHaveProperty('vc');
        expect(parsed).toHaveProperty('exportedAt');
        expect(parsed).toHaveProperty('signature');
      }),
      { numRuns: 100 },
    );
  });

  it('should preserve credential data in export', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const jsonString = ExportService.credentialToJSON(credentials);
        const parsed: ExportedCredential = JSON.parse(jsonString);

        expect(parsed.did).toBe(credentials.did);
        expect(parsed.vc).toEqual(credentials.vc);
      }),
      { numRuns: 100 },
    );
  });

  it('should verify signature of exported credential', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const jsonString = ExportService.credentialToJSON(credentials);
        const exported: ExportedCredential = JSON.parse(jsonString);

        const isValid = ExportService.verifySignature(exported);

        expect(isValid).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should fail verification for tampered credentials', () => {
    fc.assert(
      fc.property(
        credentialsArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (credentials, tamperedName) => {
          const jsonString = ExportService.credentialToJSON(credentials);
          const exported: ExportedCredential = JSON.parse(jsonString);

          exported.vc.credentialSubject.name = tamperedName;

          if (tamperedName !== credentials.vc.credentialSubject.name) {
            const isValid = ExportService.verifySignature(exported);

            expect(isValid).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should fail verification for tampered DID', () => {
    fc.assert(
      fc.property(
        credentialsArbitrary,
        fc.string({ minLength: 10, maxLength: 100 }).map((s) => `did:example:${s}`),
        (credentials, tamperedDid) => {
          const jsonString = ExportService.credentialToJSON(credentials);
          const exported: ExportedCredential = JSON.parse(jsonString);

          exported.did = tamperedDid;

          if (tamperedDid !== credentials.did) {
            const isValid = ExportService.verifySignature(exported);

            expect(isValid).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should export with signature by default', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const jsonString = ExportService.credentialToJSON(credentials);
        const parsed: ExportedCredential = JSON.parse(jsonString);

        expect(parsed.signature).toBeTruthy();
        expect(parsed.signature.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('should export without signature when option is false', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const jsonString = ExportService.credentialToJSON(credentials, {
          includeSignature: false,
        });
        const parsed: ExportedCredential = JSON.parse(jsonString);

        expect(parsed.signature).toBe('');
      }),
      { numRuns: 100 },
    );
  });

  it('should include valid ISO timestamp in export', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const jsonString = ExportService.credentialToJSON(credentials);
        const parsed: ExportedCredential = JSON.parse(jsonString);

        expect(parsed.exportedAt).toBeTruthy();
        expect(() => new Date(parsed.exportedAt)).not.toThrow();

        const exportDate = new Date(parsed.exportedAt);

        expect(exportDate.toISOString()).toBe(parsed.exportedAt);
      }),
      { numRuns: 100 },
    );
  });

  it('should parse exported credential correctly', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const jsonString = ExportService.credentialToJSON(credentials);

        expect(() => ExportService.parseExportedCredential(jsonString)).not.toThrow();

        const parsed = ExportService.parseExportedCredential(jsonString);

        expect(parsed.did).toBe(credentials.did);
        expect(parsed.vc).toEqual(credentials.vc);
        expect(parsed.exportedAt).toBeTruthy();
        expect(parsed.signature).toBeTruthy();
      }),
      { numRuns: 100 },
    );
  });

  it('should handle both pretty and compact JSON formats', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const prettyJson = ExportService.credentialToJSON(credentials, { format: 'pretty' });
        const compactJson = ExportService.credentialToJSON(credentials, { format: 'json' });

        const prettyParsed = JSON.parse(prettyJson);
        const compactParsed = JSON.parse(compactJson);

        expect(prettyParsed.did).toBe(compactParsed.did);
        expect(prettyParsed.vc).toEqual(compactParsed.vc);
        expect(prettyParsed.signature).toBe(compactParsed.signature);

        expect(prettyJson.length).toBeGreaterThan(compactJson.length);
      }),
      { numRuns: 100 },
    );
  });

  it('should maintain signature consistency across export formats', () => {
    fc.assert(
      fc.property(credentialsArbitrary, (credentials) => {
        const prettyJson = ExportService.credentialToJSON(credentials, { format: 'pretty' });
        const compactJson = ExportService.credentialToJSON(credentials, { format: 'json' });

        const prettyParsed: ExportedCredential = JSON.parse(prettyJson);
        const compactParsed: ExportedCredential = JSON.parse(compactJson);

        expect(prettyParsed.signature).toBe(compactParsed.signature);
      }),
      { numRuns: 100 },
    );
  });

  it('should reject invalid JSON when parsing', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (invalidJson) => {
        try {
          JSON.parse(invalidJson);

          return;
        } catch {}

        expect(() => ExportService.parseExportedCredential(invalidJson)).toThrow();
      }),
      { numRuns: 100 },
    );
  });

  it('should reject incomplete exported credentials when parsing', () => {
    fc.assert(
      fc.property(
        fc.record({
          did: fc.option(fc.string(), { nil: undefined }),
          vc: fc.option(fc.anything(), { nil: undefined }),
        }),
        (incompleteData) => {
          const jsonString = JSON.stringify(incompleteData);

          if (!incompleteData.did || !incompleteData.vc) {
            expect(() => ExportService.parseExportedCredential(jsonString)).toThrow();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
