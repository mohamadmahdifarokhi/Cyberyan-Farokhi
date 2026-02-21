import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { rabbitmqConfig, retryConfig } from '../config/rabbitmq.config';
import { logger } from '../utils/logger';
import { randomUUID as uuidv4 } from 'crypto';
export interface RegistrationMessage {
  messageId: string;
  timestamp: string;
  data: {
    name: string;
    email: string;
    passportImage?: string;
    selfieImage?: string;
  };
  retryCount: number;
}
export interface AuditMessage {
  messageId: string;
  timestamp: string;
  data: {
    did: string;
    operation: string;
    hash: string;
  };
  retryCount: number;
}
export type MessageHandler = (data: any) => Promise<void>;
export class RabbitMQService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  async connect(): Promise<void> {
    const { maxRetries, retryDelay, backoffMultiplier } = retryConfig;
    while (this.connectionAttempts < maxRetries) {
      try {
        this.connection = await amqp.connect(rabbitmqConfig.url);
        if (!this.connection) {
          throw new Error('Failed to create connection');
        }
        this.channel = await this.connection.createChannel();
        this.connection.on('error', (err) => {
          logger.error('RabbitMQ connection error:', err);
          this.isConnected = false;
        });
        this.connection.on('close', () => {
          logger.warn('RabbitMQ connection closed');
          this.isConnected = false;
        });
        if (!this.channel) {
          throw new Error('Failed to create channel');
        }
        await this.channel.assertQueue(rabbitmqConfig.queues.registration, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': rabbitmqConfig.queues.dlq,
          },
        });
        await this.channel.assertQueue(rabbitmqConfig.queues.audit, {
          durable: true,
        });
        await this.channel.assertQueue(rabbitmqConfig.queues.dlq, {
          durable: true,
        });
        this.channel.prefetch(rabbitmqConfig.prefetchCount);
        this.isConnected = true;
        this.connectionAttempts = 0;
        logger.info('RabbitMQ connected successfully');
        return;
      } catch (error) {
        this.connectionAttempts++;
        const delay = retryDelay * Math.pow(backoffMultiplier, this.connectionAttempts - 1);
        logger.error(`RabbitMQ connection failed (attempt ${this.connectionAttempts}/${maxRetries})`, { error });
        if (this.connectionAttempts >= maxRetries) {
          throw new Error(`Failed to connect to RabbitMQ after ${maxRetries} attempts`);
        }
        logger.info(`Retrying connection in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  async disconnect(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('RabbitMQ disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ:', error);
      throw error;
    }
  }
  isHealthy(): boolean {
    return this.isConnected && this.channel !== null;
  }
  async publishRegistration(data: Omit<RegistrationMessage, 'messageId' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
    const message: RegistrationMessage = {
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      data: data.data,
      retryCount: 0,
    };
    this.channel.sendToQueue(rabbitmqConfig.queues.registration, Buffer.from(JSON.stringify(message)), {
      persistent: true,
      headers: { 'x-retry-count': 0 },
    });
    logger.info('Registration message published', { messageId: message.messageId });
  }
  async publishAudit(data: Omit<AuditMessage, 'messageId' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
    const message: AuditMessage = {
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      data: data.data,
      retryCount: 0,
    };
    this.channel.sendToQueue(rabbitmqConfig.queues.audit, Buffer.from(JSON.stringify(message)), { persistent: true });
    logger.info('Audit message published', { messageId: message.messageId });
  }
  async consumeRegistrations(handler: MessageHandler): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.consume(rabbitmqConfig.queues.registration, async (msg) => {
      if (!msg || !this.channel) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data);
        this.channel.ack(msg);
        logger.info('Registration message processed', { messageId: data.messageId });
      } catch (error) {
        await this.handleMessageError(msg, error);
      }
    });
    logger.info('Started consuming registration messages');
  }
  async consumeAudits(handler: MessageHandler): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.consume(rabbitmqConfig.queues.audit, async (msg) => {
      if (!msg || !this.channel) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data);
        this.channel.ack(msg);
        logger.info('Audit message processed', { messageId: data.messageId });
      } catch (error) {
        logger.error('Error processing audit message:', error);
        this.channel.nack(msg, false, true);
      }
    });
    logger.info('Started consuming audit messages');
  }
  private async handleMessageError(msg: ConsumeMessage, error: any): Promise<void> {
    const retryCount = ((msg.properties.headers && msg.properties.headers['x-retry-count']) || 0) + 1;
    logger.error('Error processing message', { retryCount, error });
    if (retryCount < rabbitmqConfig.maxRetries) {
      const delay = rabbitmqConfig.retryDelays[retryCount - 1] || 4000;
      setTimeout(() => {
        if (this.channel) {
          this.channel.sendToQueue(rabbitmqConfig.queues.registration, msg.content, {
            persistent: true,
            headers: { 'x-retry-count': retryCount },
          });
          this.channel.ack(msg);
        }
      }, delay);
      logger.info(`Message will be retried after ${delay}ms`, { retryCount });
    } else {
      logger.error('Max retries reached, moving to DLQ');
      if (this.channel) {
        this.channel.nack(msg, false, false);
      }
    }
  }
}
export const rabbitmqService = new RabbitMQService();
