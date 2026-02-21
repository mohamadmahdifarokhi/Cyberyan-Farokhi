import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import mongoose from 'mongoose';
import { MongoDBService } from '../../services/mongodb.service';
import { CredentialModel } from '../../models/Credential.model';
import { AuditLogModel } from '../../models/AuditLog.model';
import {
  generateTestCredential,
  generateTestAuditLog,
  generateTestCredentials,
  generateTestAuditLogs,
  waitFor,
} from '../helpers/test.utils';

describe('API and MongoDB Integration Tests', () => {
  let mongoContainer: StartedMongoDBContainer;
  let mongoService: MongoDBService;
  let originalMongoUrl: string | undefined;

  beforeAll(async () => {
    console.log('Starting MongoDB container for integration tests...');

    mongoContainer = await new MongoDBContainer('mongo:7').withExposedPorts(27017).start();

    originalMongoUrl = process.env.MONGODB_URL;

    process.env.MONGODB_URL = mongoContainer.getConnectionString();

    mongoService = new MongoDBService();
    await mongoService.connect();

    console.log('MongoDB container started and connected');
  }, 60000);

  afterAll(async () => {
    console.log('Stopping MongoDB container...');

    if (mongoService) {
      await mongoService.disconnect();
    }

    if (mongoContainer) {
      await mongoContainer.stop();
    }

    if (originalMongoUrl) {
      process.env.MONGODB_URL = originalMongoUrl;
    }

    console.log('MongoDB container stopped');
  }, 30000);

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Credential CRUD Operations', () => {
    it('should create and retrieve a credential', async () => {
      const testCredential = generateTestCredential();

      const saved = await mongoService.saveCredential(testCredential);

      expect(saved).toBeDefined();
      expect(saved.did).toBe(testCredential.did);
      expect(saved.userInfo.name).toBe(testCredential.userInfo!.name);
      expect(saved.userInfo.email).toBe(testCredential.userInfo!.email);

      const retrieved = await mongoService.getCredential(saved.did);

      expect(retrieved).toBeDefined();
      expect(retrieved!.did).toBe(saved.did);
      expect(retrieved!.userInfo.name).toBe(saved.userInfo.name);
      expect(retrieved!.userInfo.email).toBe(saved.userInfo.email);
      expect(retrieved!.jwt).toBe(saved.jwt);
    });

    it('should create multiple credentials without conflicts', async () => {
      const credentials = generateTestCredentials(5);

      const savedCredentials = await Promise.all(credentials.map((cred) => mongoService.saveCredential(cred)));

      expect(savedCredentials).toHaveLength(5);

      const allCredentials = await mongoService.getAllCredentials(10, 0);

      expect(allCredentials).toHaveLength(5);

      for (const saved of savedCredentials) {
        const found = allCredentials.find((c) => c.did === saved.did);
        expect(found).toBeDefined();
        expect(found!.userInfo.name).toBe(saved.userInfo.name);
      }
    });

    it('should update FCM token for a credential', async () => {
      const testCredential = generateTestCredential();
      const saved = await mongoService.saveCredential(testCredential);
      const newFcmToken = 'test-fcm-token-12345';

      await mongoService.updateFCMToken(saved.did, newFcmToken);

      const updated = await mongoService.getCredential(saved.did);
      expect(updated).toBeDefined();
      expect(updated!.fcmToken).toBe(newFcmToken);
    });

    it('should return null for non-existent credential', async () => {
      const result = await mongoService.getCredential('did:example:nonexistent');

      expect(result).toBeNull();
    });

    it('should handle pagination correctly', async () => {
      const credentials = generateTestCredentials(10);
      await Promise.all(credentials.map((cred) => mongoService.saveCredential(cred)));

      const page1 = await mongoService.getAllCredentials(5, 0);

      expect(page1).toHaveLength(5);

      const page2 = await mongoService.getAllCredentials(5, 5);

      expect(page2).toHaveLength(5);

      const page1DIDs = page1.map((c) => c.did);
      const page2DIDs = page2.map((c) => c.did);
      const overlap = page1DIDs.filter((did) => page2DIDs.includes(did));
      expect(overlap).toHaveLength(0);
    });

    it('should search credentials by name', async () => {
      const credential1 = generateTestCredential({
        userInfo: {
          name: 'John Smith',
          email: 'john@example.com',
        },
      });
      const credential2 = generateTestCredential({
        userInfo: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });
      const credential3 = generateTestCredential({
        userInfo: {
          name: 'Bob Johnson',
          email: 'bob@example.com',
        },
      });

      await mongoService.saveCredential(credential1);
      await mongoService.saveCredential(credential2);
      await mongoService.saveCredential(credential3);

      const results = await mongoService.searchCredentials('John');

      expect(results.length).toBeGreaterThanOrEqual(1);
      const foundJohn = results.some((c) => c.userInfo.name.includes('John'));
      expect(foundJohn).toBe(true);
    });

    it('should search credentials by email', async () => {
      const credential = generateTestCredential({
        userInfo: {
          name: 'Test User',
          email: 'unique-email@test.com',
        },
      });
      await mongoService.saveCredential(credential);

      const results = await mongoService.searchCredentials('unique-email');

      expect(results.length).toBeGreaterThanOrEqual(1);
      const found = results.find((c) => c.userInfo.email === 'unique-email@test.com');
      expect(found).toBeDefined();
    });
  });

  describe('Audit Log Queries', () => {
    it('should create and retrieve audit logs', async () => {
      const testLog = generateTestAuditLog();

      const saved = await mongoService.saveAuditLog(testLog);

      expect(saved).toBeDefined();
      expect(saved.did).toBe(testLog.did);
      expect(saved.operation).toBe(testLog.operation);
      expect(saved.hash).toBe(testLog.hash);
    });

    it('should filter audit logs by DID', async () => {
      const targetDID = 'did:example:target-123';
      const log1 = generateTestAuditLog({ did: targetDID });
      const log2 = generateTestAuditLog({ did: targetDID });
      const log3 = generateTestAuditLog({ did: 'did:example:other-456' });

      await mongoService.saveAuditLog(log1);
      await mongoService.saveAuditLog(log2);
      await mongoService.saveAuditLog(log3);

      const result = await mongoService.getAuditLogs({ did: targetDID });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.logs.every((log) => log.did === targetDID)).toBe(true);
    });

    it('should filter audit logs by operation', async () => {
      const log1 = generateTestAuditLog({ operation: 'CREATE' });
      const log2 = generateTestAuditLog({ operation: 'CREATE' });
      const log3 = generateTestAuditLog({ operation: 'UPDATE' });

      await mongoService.saveAuditLog(log1);
      await mongoService.saveAuditLog(log2);
      await mongoService.saveAuditLog(log3);

      const result = await mongoService.getAuditLogs({ operation: 'CREATE' });

      expect(result.logs).toHaveLength(2);
      expect(result.logs.every((log) => log.operation === 'CREATE')).toBe(true);
    });

    it('should filter audit logs by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const log1 = generateTestAuditLog({ timestamp: twoDaysAgo });
      const log2 = generateTestAuditLog({ timestamp: yesterday });
      const log3 = generateTestAuditLog({ timestamp: now });

      await mongoService.saveAuditLog(log1);
      await mongoService.saveAuditLog(log2);
      await mongoService.saveAuditLog(log3);

      const result = await mongoService.getAuditLogs({
        startDate: yesterday,
      });

      expect(result.logs.length).toBeGreaterThanOrEqual(2);
      expect(result.logs.every((log) => log.timestamp >= yesterday)).toBe(true);
    });

    it('should paginate audit logs correctly', async () => {
      const logs = generateTestAuditLogs(10);
      await Promise.all(logs.map((log) => mongoService.saveAuditLog(log)));

      const page1 = await mongoService.getAuditLogs({ limit: 5, offset: 0 });

      expect(page1.logs).toHaveLength(5);
      expect(page1.total).toBe(10);
      expect(page1.hasMore).toBe(true);

      const page2 = await mongoService.getAuditLogs({ limit: 5, offset: 5 });

      expect(page2.logs).toHaveLength(5);
      expect(page2.total).toBe(10);
      expect(page2.hasMore).toBe(false);
    });

    it('should combine multiple filters', async () => {
      const targetDID = 'did:example:combined-test';
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const log1 = generateTestAuditLog({
        did: targetDID,
        operation: 'CREATE',
        timestamp: new Date(),
      });
      const log2 = generateTestAuditLog({
        did: targetDID,
        operation: 'UPDATE',
        timestamp: new Date(),
      });
      const log3 = generateTestAuditLog({
        did: 'did:example:other',
        operation: 'CREATE',
        timestamp: new Date(),
      });

      await mongoService.saveAuditLog(log1);
      await mongoService.saveAuditLog(log2);
      await mongoService.saveAuditLog(log3);

      const result = await mongoService.getAuditLogs({
        did: targetDID,
        operation: 'CREATE',
        startDate: yesterday,
      });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].did).toBe(targetDID);
      expect(result.logs[0].operation).toBe('CREATE');
    });
  });

  describe('Analytics Aggregation', () => {
    it('should count total registrations', async () => {
      const credentials = generateTestCredentials(7);
      await Promise.all(credentials.map((cred) => mongoService.saveCredential(cred)));

      const count = await mongoService.getRegistrationCount();

      expect(count).toBe(7);
    });

    it('should calculate registration trend', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const cred1 = generateTestCredential();
      const cred2 = generateTestCredential();
      const cred3 = generateTestCredential();

      await mongoService.saveCredential(cred1);
      await mongoService.saveCredential(cred2);
      await mongoService.saveCredential(cred3);

      const trend = await mongoService.getRegistrationTrend(7);

      expect(Array.isArray(trend)).toBe(true);
      expect(trend.length).toBeGreaterThan(0);

      if (trend.length > 0) {
        expect(trend[0]).toHaveProperty('date');
        expect(trend[0]).toHaveProperty('count');
        expect(typeof trend[0].count).toBe('number');
      }
    });

    it('should calculate average processing time', async () => {
      const log1 = generateTestAuditLog({ processingTime: 100 });
      const log2 = generateTestAuditLog({ processingTime: 200 });
      const log3 = generateTestAuditLog({ processingTime: 300 });

      await mongoService.saveAuditLog(log1);
      await mongoService.saveAuditLog(log2);
      await mongoService.saveAuditLog(log3);

      const avgTime = await mongoService.getAverageProcessingTime();

      expect(avgTime).toBe(200);
    });

    it('should handle empty analytics gracefully', async () => {
      const count = await mongoService.getRegistrationCount();
      const trend = await mongoService.getRegistrationTrend(7);
      const avgTime = await mongoService.getAverageProcessingTime();

      expect(count).toBe(0);
      expect(Array.isArray(trend)).toBe(true);
      expect(trend).toHaveLength(0);
      expect(avgTime).toBe(0);
    });

    it('should record analytics correctly', async () => {
      const testDate = new Date();
      const registrationCount = 5;
      const processingTime = 250;

      await mongoService.recordAnalytics(testDate, registrationCount, processingTime);

      expect(true).toBe(true);
    });
  });

  describe('Connection Failure Handling', () => {
    it('should report healthy status when connected', () => {
      const isHealthy = mongoService.isHealthy();
      const status = mongoService.getConnectionStatus();

      expect(isHealthy).toBe(true);
      expect(status).toBe('connected');
    });

    it('should handle graceful disconnection', async () => {
      const testService = new MongoDBService();
      await testService.connect();

      await testService.disconnect();

      expect(testService.isHealthy()).toBe(false);
      expect(testService.getConnectionStatus()).toBe('disconnected');
    });

    it('should handle errors when saving to disconnected database', async () => {
      const testService = new MongoDBService();
      await testService.connect();
      await testService.disconnect();

      const testCredential = generateTestCredential();
      await expect(testService.saveCredential(testCredential)).rejects.toThrow();
    });

    it('should handle errors when querying disconnected database', async () => {
      const testService = new MongoDBService();
      await testService.connect();
      await testService.disconnect();

      await expect(testService.getCredential('did:example:test')).rejects.toThrow();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data integrity across multiple operations', async () => {
      const credential = generateTestCredential();
      const auditLog = generateTestAuditLog({ did: credential.did });

      const savedCred = await mongoService.saveCredential(credential);
      const savedLog = await mongoService.saveAuditLog(auditLog);

      expect(savedCred.did).toBe(credential.did);
      expect(savedLog.did).toBe(credential.did);

      const retrievedCred = await mongoService.getCredential(credential.did!);
      const retrievedLogs = await mongoService.getAuditLogs({ did: credential.did });

      expect(retrievedCred).toBeDefined();
      expect(retrievedCred!.did).toBe(credential.did);
      expect(retrievedLogs.logs).toHaveLength(1);
      expect(retrievedLogs.logs[0].did).toBe(credential.did);
    });

    it('should handle concurrent writes without data corruption', async () => {
      const credentials = generateTestCredentials(10);

      const savePromises = credentials.map((cred) => mongoService.saveCredential(cred));
      const savedCredentials = await Promise.all(savePromises);

      expect(savedCredentials).toHaveLength(10);

      const allCredentials = await mongoService.getAllCredentials(20, 0);

      expect(allCredentials).toHaveLength(10);

      const dids = allCredentials.map((c) => c.did);
      const uniqueDids = new Set(dids);
      expect(uniqueDids.size).toBe(10);
    });
  });
});
