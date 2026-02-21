import { logger } from '../utils/logger';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase.config';
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority: 'high' | 'normal';
}
export class PushNotificationService {
  private initialized: boolean = false;
  async initialize(): Promise<void> {
    if (!isFirebaseConfigured()) {
      logger.warn('Firebase not configured, push notifications disabled');
      return;
    }
    try {
      this.initialized = true;
      logger.info('Push notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize push notifications:', error);
    }
  }
  async sendNotification(token: string, notification: NotificationPayload): Promise<void> {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized');
      return;
    }
    try {
      logger.info('Sending push notification', { token: token.substring(0, 10) + '...' });
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  }
  async sendBulkNotifications(tokens: string[], notification: NotificationPayload): Promise<void> {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized');
      return;
    }
    try {
      logger.info('Sending bulk notifications', { count: tokens.length });
    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
      throw error;
    }
  }
  async registerToken(userId: string, token: string): Promise<void> {
    try {
      logger.info('Registering FCM token', { userId });
    } catch (error) {
      logger.error('Error registering token:', error);
      throw error;
    }
  }
}
export const pushNotificationService = new PushNotificationService();
