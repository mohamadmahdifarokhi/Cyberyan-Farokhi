import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushNotificationService {
  initialize(): Promise<void>;
  requestPermission(): Promise<boolean>;
  getToken(): Promise<string | null>;
  onNotificationReceived(callback: (notification: FirebaseMessagingTypes.RemoteMessage) => void): () => void;
  onNotificationOpened(callback: (notification: FirebaseMessagingTypes.RemoteMessage) => void): () => void;
  onTokenRefresh(callback: (token: string) => void): () => void;
}

class PushNotificationServiceImpl implements PushNotificationService {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    console.log('[Web] Push notifications not supported on web platform');
    this.initialized = true;
  }

  async requestPermission(): Promise<boolean> {
    console.log('[Web] Push notification permission not available on web');

    return false;
  }

  async getToken(): Promise<string | null> {
    console.log('[Web] Push notification token not available on web');

    return null;
  }

  onNotificationReceived(_callback: (notification: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    console.log('[Web] Notification received listener not supported on web');

    return () => {};
  }

  onNotificationOpened(_callback: (notification: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    console.log('[Web] Notification opened listener not supported on web');

    return () => {};
  }

  onTokenRefresh(_callback: (token: string) => void): () => void {
    console.log('[Web] Token refresh listener not supported on web');

    return () => {};
  }

  static setBackgroundMessageHandler(_handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>): void {
    console.log('[Web] Background message handler not supported on web');
  }
}

export const pushNotificationService = new PushNotificationServiceImpl();
