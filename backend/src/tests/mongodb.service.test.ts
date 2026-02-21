import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoDBService } from '../services/mongodb.service';
import { ICredential } from '../models/Credential.model';

describe('MongoDBService - Property-Based Tests', () => {
  let mongoService: MongoDBService;
  const testDBName = 'test_vc_did_db';

  const credentialArbitrary = fc.record({
    did: fc.string({ minLength: 10, maxLength: 100 }).map((s) => `did:example:${s}`),
    vc: fc.record({
      '@context': fc.constant(['https://www.w3.org/2018/credentials/v1']),
      type: fc.constant(['VerifiableCredential']),
      issuer: fc.string({ minLength: 10, maxLength: 50 }),
      issuanceDate: fc.date().map((d) => d.toISOString()),
      credentialSubject: fc.record({
        id: fc.string({ minLength: 10, maxLength: 50 }),
        name: fc.string({ minLength: 1, maxLength: 100 }),
      }),
    }),
    userInfo: fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      email: fc.emailAddress(),
      passportImage: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
      selfieImage: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
    }),
    jwt: fc.string({ minLength: 20, maxLength: 500 }),
  });

  beforeAll(async () => {
    const mongoURL = process.env.MONGODB_URL || `mongodb://localhost:27017/${testDBName}`;
    process.env.MONGODB_URL = mongoURL;

    mongoService = new MongoDBService();
    await mongoService.connect();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoService.disconnect();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Property 2: MongoDB data persistence', () => {
    it('should persist and retrieve credentials with identical data', async () => {
      await fc.assert(
        fc.asyncProperty(credentialArbitrary, async (credentialData) => {
          const saved = await mongoService.saveCredential(credentialData as Partial<ICredential>);

          const retrieved = await mongoService.getCredential(saved.did);

          if (!retrieved) {
            return false;
          }

          const fieldsMatch =
            retrieved.did === saved.did &&
            JSON.stringify(retrieved.vc) === JSON.stringify(saved.vc) &&
            retrieved.userInfo.name === saved.userInfo.name &&
            retrieved.userInfo.email === saved.userInfo.email &&
            retrieved.userInfo.passportImage === saved.userInfo.passportImage &&
            retrieved.userInfo.selfieImage === saved.userInfo.selfieImage &&
            retrieved.jwt === saved.jwt;

          return fieldsMatch;
        }),
        { numRuns: 100 },
      );
    });

    it('should handle multiple credentials without data corruption', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(credentialArbitrary, { minLength: 2, maxLength: 10 }), async (credentials) => {
          const uniqueCredentials = credentials.map((cred, index) => ({
            ...cred,
            did: `${cred.did}-${index}`,
          }));

          const savedCredentials = await Promise.all(
            uniqueCredentials.map((cred) => mongoService.saveCredential(cred as Partial<ICredential>)),
          );

          const retrievedCredentials = await Promise.all(
            savedCredentials.map((saved) => mongoService.getCredential(saved.did)),
          );

          if (retrievedCredentials.some((r) => r === null)) {
            return false;
          }

          return savedCredentials.every((saved, index) => {
            const retrieved = retrievedCredentials[index]!;
            return (
              retrieved.did === saved.did &&
              retrieved.userInfo.name === saved.userInfo.name &&
              retrieved.userInfo.email === saved.userInfo.email &&
              retrieved.jwt === saved.jwt
            );
          });
        }),
        { numRuns: 50 },
      );
    });

    it('should return null for non-existent DIDs', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 10, maxLength: 100 }), async (randomDID) => {
          const did = `did:example:nonexistent-${randomDID}`;
          const retrieved = await mongoService.getCredential(did);
          return retrieved === null;
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 2 Extension: Search functionality', () => {
    it('should find credentials by search query', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(credentialArbitrary, { minLength: 3, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          async (credentials, targetIndex) => {
            const uniqueCredentials = credentials.map((cred, index) => ({
              ...cred,
              did: `did:example:test-${index}`,
            }));

            await Promise.all(
              uniqueCredentials.map((cred) => mongoService.saveCredential(cred as Partial<ICredential>)),
            );

            const targetCred = uniqueCredentials[targetIndex % uniqueCredentials.length];
            const searchResults = await mongoService.searchCredentials(targetCred.userInfo.name);

            return searchResults.some((result) => result.did === targetCred.did);
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  describe('Property 3: Encryption at rest', () => {
    it('should store encrypted data and decrypt on retrieval', async () => {
      const { securityService } = await import('../services/security.service');

      await fc.assert(
        fc.asyncProperty(credentialArbitrary, async (credentialData) => {
          const encryptedEmail = securityService.encrypt(credentialData.userInfo.email);
          const encryptedJWT = securityService.encrypt(credentialData.jwt);

          const credentialToSave = {
            ...credentialData,
            userInfo: {
              ...credentialData.userInfo,
              email: encryptedEmail,
            },
            jwt: encryptedJWT,
          };

          const saved = await mongoService.saveCredential(credentialToSave as Partial<ICredential>);

          const retrieved = await mongoService.getCredential(saved.did);

          if (!retrieved) {
            return false;
          }

          const emailIsDifferent = retrieved.userInfo.email !== credentialData.userInfo.email;
          const jwtIsDifferent = retrieved.jwt !== credentialData.jwt;

          const decryptedEmail = securityService.decrypt(retrieved.userInfo.email);
          const decryptedJWT = securityService.decrypt(retrieved.jwt);

          const emailMatches = decryptedEmail === credentialData.userInfo.email;
          const jwtMatches = decryptedJWT === credentialData.jwt;

          return emailIsDifferent && jwtIsDifferent && emailMatches && jwtMatches;
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 16: MongoDB connection resilience', () => {
    it('should handle connection status checks', () => {
      const status = mongoService.getConnectionStatus();
      expect(['connected', 'disconnected', 'connecting', 'disconnecting', 'unknown']).toContain(status);
    });

    it('should report healthy status when connected', () => {
      const isHealthy = mongoService.isHealthy();
      expect(typeof isHealthy).toBe('boolean');

      expect(isHealthy).toBe(true);
    });

    it('should handle graceful disconnection', async () => {
      const testService = new MongoDBService();

      await testService.connect();
      expect(testService.isHealthy()).toBe(true);

      await testService.disconnect();
      expect(testService.isHealthy()).toBe(false);
    });
  });
});
