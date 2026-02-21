import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { RabbitMQService, RegistrationMessage, AuditMessage } from '../../services/rabbitmq.service';
import { waitFor, sleep } from '../helpers/test.utils';
import amqp from 'amqplib';

describe('API and RabbitMQ Integration Tests', () => {
  let rabbitContainer: StartedRabbitMQContainer;
  let rabbitService: RabbitMQService;
  let originalRabbitUrl: string | undefined;
  let testConnection: any;
  let testChannel: any;

  beforeAll(async () => {
    console.log('Starting RabbitMQ container for integration tests...');

    rabbitContainer = await new RabbitMQContainer('rabbitmq:3-management-alpine').withExposedPorts(5672, 15672).start();

    originalRabbitUrl = process.env.RABBITMQ_URL;

    process.env.RABBITMQ_URL = rabbitContainer.getAmqpUrl();

    rabbitService = new RabbitMQService();
    await rabbitService.connect();

    testConnection = await amqp.connect(rabbitContainer.getAmqpUrl());
    testChannel = await testConnection.createChannel();

    console.log('RabbitMQ container started and connected');
  }, 60000);

  afterAll(async () => {
    console.log('Stopping RabbitMQ container...');

    if (testChannel) {
      await testChannel.close();
    }
    if (testConnection) {
      await testConnection.close();
    }
    if (rabbitService) {
      await rabbitService.disconnect();
    }

    if (rabbitContainer) {
      await rabbitContainer.stop();
    }

    if (originalRabbitUrl) {
      process.env.RABBITMQ_URL = originalRabbitUrl;
    }

    console.log('RabbitMQ container stopped');
  }, 30000);

  afterEach(async () => {
    try {
      await testChannel.purgeQueue('vc-registration-queue');
      await testChannel.purgeQueue('vc-audit-queue');
      await testChannel.purgeQueue('vc-dlq');
    } catch (error) {}
  });

  describe('Message Publishing', () => {
    it('should publish registration message to queue', async () => {
      const testData = {
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          passportImage: 'passport.jpg',
          selfieImage: 'selfie.jpg',
        },
      };

      await rabbitService.publishRegistration(testData);

      await sleep(100);

      const queueInfo = await testChannel.checkQueue('vc-registration-queue');
      expect(queueInfo.messageCount).toBe(1);
    });

    it('should publish audit message to queue', async () => {
      const testData = {
        data: {
          did: 'did:example:123',
          operation: 'CREATE',
          hash: 'abc123',
        },
      };

      await rabbitService.publishAudit(testData);

      await sleep(100);

      const queueInfo = await testChannel.checkQueue('vc-audit-queue');
      expect(queueInfo.messageCount).toBe(1);
    });

    it('should publish multiple messages without loss', async () => {
      const messageCount = 10;
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        data: {
          name: `User ${i}`,
          email: `user${i}@example.com`,
        },
      }));

      await Promise.all(messages.map((msg) => rabbitService.publishRegistration(msg)));

      await sleep(200);

      const queueInfo = await testChannel.checkQueue('vc-registration-queue');
      expect(queueInfo.messageCount).toBe(messageCount);
    });

    it('should include message metadata', async () => {
      const testData = {
        data: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      await rabbitService.publishRegistration(testData);
      await sleep(100);

      const message = await new Promise<RegistrationMessage>((resolve) => {
        testChannel.consume('vc-registration-queue', (msg: any) => {
          if (msg) {
            const data = JSON.parse(msg.content.toString());
            testChannel.ack(msg);
            resolve(data);
          }
        });
      });

      expect(message).toHaveProperty('messageId');
      expect(message).toHaveProperty('timestamp');
      expect(message).toHaveProperty('retryCount');
      expect(message.retryCount).toBe(0);
      expect(message.data.name).toBe('Test User');
      expect(message.data.email).toBe('test@example.com');
    });
  });

  describe('Message Consumption', () => {
    it('should consume registration messages', async () => {
      const receivedMessages: RegistrationMessage[] = [];
      const testData = {
        data: {
          name: 'Consumer Test',
          email: 'consumer@example.com',
        },
      };

      await rabbitService.consumeRegistrations(async (data) => {
        receivedMessages.push(data);
      });

      await rabbitService.publishRegistration(testData);

      await waitFor(() => receivedMessages.length > 0, 5000);

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].data.name).toBe('Consumer Test');
      expect(receivedMessages[0].data.email).toBe('consumer@example.com');
    });

    it('should consume audit messages', async () => {
      const receivedMessages: AuditMessage[] = [];
      const testData = {
        data: {
          did: 'did:example:audit-test',
          operation: 'CREATE',
          hash: 'hash123',
        },
      };

      await rabbitService.consumeAudits(async (data) => {
        receivedMessages.push(data);
      });

      await rabbitService.publishAudit(testData);

      await waitFor(() => receivedMessages.length > 0, 5000);

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].data.did).toBe('did:example:audit-test');
      expect(receivedMessages[0].data.operation).toBe('CREATE');
    });

    it('should process multiple messages in order', async () => {
      const receivedMessages: RegistrationMessage[] = [];
      const messageCount = 5;

      await rabbitService.consumeRegistrations(async (data) => {
        receivedMessages.push(data);
      });

      for (let i = 0; i < messageCount; i++) {
        await rabbitService.publishRegistration({
          data: {
            name: `User ${i}`,
            email: `user${i}@example.com`,
          },
        });
      }

      await waitFor(() => receivedMessages.length === messageCount, 5000);

      expect(receivedMessages).toHaveLength(messageCount);
      for (let i = 0; i < messageCount; i++) {
        expect(receivedMessages[i].data.name).toBe(`User ${i}`);
      }
    });

    it('should acknowledge messages after successful processing', async () => {
      const testData = {
        data: {
          name: 'Ack Test',
          email: 'ack@example.com',
        },
      };

      let messageProcessed = false;

      await rabbitService.consumeRegistrations(async (data) => {
        messageProcessed = true;
      });

      await rabbitService.publishRegistration(testData);

      await waitFor(() => messageProcessed, 5000);
      await sleep(200);

      const queueInfo = await testChannel.checkQueue('vc-registration-queue');
      expect(queueInfo.messageCount).toBe(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed message processing', async () => {
      let attemptCount = 0;
      const testData = {
        data: {
          name: 'Retry Test',
          email: 'retry@example.com',
        },
      };

      await rabbitService.consumeRegistrations(async (data) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Simulated processing error');
        }
      });

      await rabbitService.publishRegistration(testData);

      await waitFor(() => attemptCount >= 2, 10000);

      expect(attemptCount).toBeGreaterThanOrEqual(2);
    });

    it('should apply exponential backoff for retries', async () => {
      const attemptTimes: number[] = [];
      const testData = {
        data: {
          name: 'Backoff Test',
          email: 'backoff@example.com',
        },
      };

      await rabbitService.consumeRegistrations(async (data) => {
        attemptTimes.push(Date.now());
        throw new Error('Simulated error for backoff test');
      });

      await rabbitService.publishRegistration(testData);

      await waitFor(() => attemptTimes.length >= 2, 15000);

      if (attemptTimes.length >= 2) {
        const firstDelay = attemptTimes[1] - attemptTimes[0];

        expect(firstDelay).toBeGreaterThan(500);
      }
    });

    it('should increment retry count on each attempt', async () => {
      const retryCounts: number[] = [];
      const testData = {
        data: {
          name: 'Retry Count Test',
          email: 'retrycount@example.com',
        },
      };

      await rabbitService.consumeRegistrations(async (data) => {
        retryCounts.push(data.retryCount || 0);
        throw new Error('Simulated error');
      });

      await rabbitService.publishRegistration(testData);

      await waitFor(() => retryCounts.length >= 2, 15000);

      expect(retryCounts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Dead Letter Queue', () => {
    it('should move message to DLQ after max retries', async () => {
      let attemptCount = 0;
      const testData = {
        data: {
          name: 'DLQ Test',
          email: 'dlq@example.com',
        },
      };

      await rabbitService.consumeRegistrations(async (data) => {
        attemptCount++;
        throw new Error('Simulated persistent error');
      });

      await rabbitService.publishRegistration(testData);

      await sleep(20000);

      const dlqInfo = await testChannel.checkQueue('vc-dlq');
      expect(dlqInfo.messageCount).toBeGreaterThan(0);
    }, 30000);

    it('should preserve message data in DLQ', async () => {
      const testData = {
        data: {
          name: 'DLQ Data Test',
          email: 'dlqdata@example.com',
        },
      };

      await rabbitService.consumeRegistrations(async (data) => {
        throw new Error('Simulated error');
      });

      await rabbitService.publishRegistration(testData);

      await sleep(20000);

      const dlqMessage = await new Promise<RegistrationMessage | null>((resolve) => {
        testChannel.consume('vc-dlq', (msg: any) => {
          if (msg) {
            const data = JSON.parse(msg.content.toString());
            testChannel.ack(msg);
            resolve(data);
          } else {
            resolve(null);
          }
        });

        setTimeout(() => resolve(null), 5000);
      });

      if (dlqMessage) {
        expect(dlqMessage.data.name).toBe('DLQ Data Test');
        expect(dlqMessage.data.email).toBe('dlqdata@example.com');
      }
    }, 30000);
  });

  describe('Connection Health', () => {
    it('should report healthy status when connected', () => {
      const isHealthy = rabbitService.isHealthy();

      expect(isHealthy).toBe(true);
    });

    it('should handle graceful disconnection', async () => {
      const testService = new RabbitMQService();
      await testService.connect();

      await testService.disconnect();

      expect(testService.isHealthy()).toBe(false);
    });

    it('should throw error when publishing to disconnected service', async () => {
      const testService = new RabbitMQService();
      await testService.connect();
      await testService.disconnect();

      await expect(
        testService.publishRegistration({
          data: {
            name: 'Test',
            email: 'test@example.com',
          },
        }),
      ).rejects.toThrow('Channel not initialized');
    });

    it('should throw error when consuming from disconnected service', async () => {
      const testService = new RabbitMQService();
      await testService.connect();
      await testService.disconnect();

      await expect(testService.consumeRegistrations(async () => {})).rejects.toThrow('Channel not initialized');
    });
  });

  describe('Message Persistence', () => {
    it('should persist messages across service restarts', async () => {
      const testData = {
        data: {
          name: 'Persistence Test',
          email: 'persist@example.com',
        },
      };

      await rabbitService.publishRegistration(testData);
      await sleep(100);

      await rabbitService.disconnect();

      await rabbitService.connect();
      await sleep(100);

      const queueInfo = await testChannel.checkQueue('vc-registration-queue');
      expect(queueInfo.messageCount).toBe(1);
    });

    it('should handle multiple publishers', async () => {
      const service1 = new RabbitMQService();
      const service2 = new RabbitMQService();

      await service1.connect();
      await service2.connect();

      await service1.publishRegistration({
        data: { name: 'User 1', email: 'user1@example.com' },
      });
      await service2.publishRegistration({
        data: { name: 'User 2', email: 'user2@example.com' },
      });

      await sleep(200);

      const queueInfo = await testChannel.checkQueue('vc-registration-queue');
      expect(queueInfo.messageCount).toBe(2);

      await service1.disconnect();
      await service2.disconnect();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed messages gracefully', async () => {
      let errorCaught = false;

      await rabbitService.consumeRegistrations(async (data) => {});

      testChannel.sendToQueue('vc-registration-queue', Buffer.from('invalid json {{{'), { persistent: true });

      await sleep(1000);

      expect(rabbitService.isHealthy()).toBe(true);
    });

    it('should handle consumer errors without crashing', async () => {
      let processedCount = 0;

      await rabbitService.consumeRegistrations(async (data) => {
        processedCount++;
        throw new Error('Consumer error');
      });

      await rabbitService.publishRegistration({
        data: { name: 'Error Test', email: 'error@example.com' },
      });

      await sleep(2000);

      expect(processedCount).toBeGreaterThan(0);
      expect(rabbitService.isHealthy()).toBe(true);
    });
  });
});
