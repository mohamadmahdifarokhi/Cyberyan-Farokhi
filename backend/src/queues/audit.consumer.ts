import { rabbitmqService, AuditMessage } from '../services/rabbitmq.service';
import { mongoDBService } from '../services/mongodb.service';
import { logger } from '../utils/logger';

export async function startAuditConsumer(): Promise<void> {
  await rabbitmqService.consumeAudits(async (message: AuditMessage) => {
    try {
      logger.info('Processing audit message', { messageId: message.messageId });
      const { did, operation, hash } = message.data;
      await mongoDBService.saveAuditLog({
        did,
        hash,
        operation,
        timestamp: new Date(message.timestamp),
        metadata: { messageId: message.messageId },
      });
      logger.info('Audit log saved', { messageId: message.messageId });
    } catch (error) {
      logger.error('Error processing audit message', {
        messageId: message.messageId,
        error,
      });
      throw error;
    }
  });
}
