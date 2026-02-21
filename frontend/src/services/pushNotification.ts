import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

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
    try {
      await this.requestPermission();
      this.initialized = true;
      console.log('Push notification service initialized');
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Push notification permission granted:', authStatus);
      } else {
        console.log('Push notification permission denied');
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting push notification permission:', error);

      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const hasPermission = await messaging().hasPermission();

      if (
        hasPermission !== messaging.AuthorizationStatus.AUTHORIZED &&
        hasPermission !== messaging.AuthorizationStatus.PROVISIONAL
      ) {
        console.log('Push notification permission not granted');

        return null;
      }
      const token = await messaging().getToken();

      console.log('FCM Token:', token);

      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);

      return null;
    }
  }

  onNotificationReceived(callback: (notification: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);
      callback(remoteMessage);
    });

    return unsubscribe;
  }

  onNotificationOpened(callback: (notification: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    const unsubscribeBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened from background:', remoteMessage);
      callback(remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened from quit state:', remoteMessage);
          callback(remoteMessage);
        }
      });

    return unsubscribeBackground;
  }

  onTokenRefresh(callback: (token: string) => void): () => void {
    const unsubscribe = messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      callback(token);
    });

    return unsubscribe;
  }

  static setBackgroundMessageHandler(handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>): void {
    messaging().setBackgroundMessageHandler(handler);
  }
}

export const pushNotificationService = new PushNotificationServiceImpl();

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background message received:', remoteMessage);
});
