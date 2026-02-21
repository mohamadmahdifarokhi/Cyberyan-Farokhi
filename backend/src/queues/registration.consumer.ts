import { rabbitmqService, RegistrationMessage } from '../services/rabbitmq.service';
import { mongoDBService } from '../services/mongodb.service';
import { securityService } from '../services/security.service';
import { logger } from '../utils/logger';
export async function startRegistrationConsumer(): Promise<void> {
  await rabbitmqService.consumeRegistrations(async (message: RegistrationMessage) => {
    const startTime = Date.now();
    try {
      logger.info('Processing registration message', { messageId: message.messageId });
      const { name, email, passportImage, selfieImage } = message.data;
      const encryptedEmail = securityService.encrypt(email);
      const processingTime = Date.now() - startTime;
      logger.info('Registration processed successfully', {
        messageId: message.messageId,
        processingTime,
      });
    } catch (error) {
      logger.error('Error processing registration', {
        messageId: message.messageId,
        error,
      });
      throw error;
    }
  });
}
