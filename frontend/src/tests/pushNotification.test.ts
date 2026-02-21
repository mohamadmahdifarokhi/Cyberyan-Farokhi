import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

const mockRequestPermission = jest.fn();
const mockHasPermission = jest.fn();
const mockGetToken = jest.fn();
const mockOnMessage = jest.fn();
const mockOnNotificationOpenedApp = jest.fn();
const mockGetInitialNotification = jest.fn();
const mockOnTokenRefresh = jest.fn();
const mockSetBackgroundMessageHandler = jest.fn();

jest.mock('@react-native-firebase/messaging', () => {
  const mockMessaging = jest.fn(() => ({
    requestPermission: mockRequestPermission,
    hasPermission: mockHasPermission,
    getToken: mockGetToken,
    onMessage: mockOnMessage,
    onNotificationOpenedApp: mockOnNotificationOpenedApp,
    getInitialNotification: mockGetInitialNotification,
    onTokenRefresh: mockOnTokenRefresh,
    setBackgroundMessageHandler: mockSetBackgroundMessageHandler,
  }));

  (mockMessaging as any).AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };

  return {
    __esModule: true,
    default: mockMessaging,
  };
});

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

import { pushNotificationService } from '../services/pushNotification';
import messaging from '@react-native-firebase/messaging';

describe('Push Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully and request permission', async () => {
      mockRequestPermission.mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);

      await pushNotificationService.initialize();

      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should complete initialization even if permission request fails', async () => {
      jest.resetModules();
      const { pushNotificationService: freshService } = await import('../services/pushNotification');

      mockRequestPermission.mockRejectedValue(new Error('Permission denied'));

      await expect(freshService.initialize()).resolves.not.toThrow();
    });

    it('should not reinitialize if already initialized', async () => {
      jest.resetModules();

      const { pushNotificationService: freshService } = await import('../services/pushNotification');

      mockRequestPermission.mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);

      await freshService.initialize();
      mockRequestPermission.mockClear();

      await freshService.initialize();

      expect(mockRequestPermission).not.toHaveBeenCalled();
    });
  });

  describe('requestPermission', () => {
    it('should return true when permission is authorized', async () => {
      mockRequestPermission.mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);

      const result = await pushNotificationService.requestPermission();

      expect(result).toBe(true);
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should return true when permission is provisional', async () => {
      mockRequestPermission.mockResolvedValue(messaging.AuthorizationStatus.PROVISIONAL);

      const result = await pushNotificationService.requestPermission();

      expect(result).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      mockRequestPermission.mockResolvedValue(messaging.AuthorizationStatus.DENIED);

      const result = await pushNotificationService.requestPermission();

      expect(result).toBe(false);
    });

    it('should return false when permission request fails', async () => {
      mockRequestPermission.mockRejectedValue(new Error('Permission error'));

      const result = await pushNotificationService.requestPermission();

      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return FCM token when permission is granted', async () => {
      const mockToken = 'mock-fcm-token-12345';

      mockHasPermission.mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);
      mockGetToken.mockResolvedValue(mockToken);

      const token = await pushNotificationService.getToken();

      expect(token).toBe(mockToken);
      expect(mockHasPermission).toHaveBeenCalled();
      expect(mockGetToken).toHaveBeenCalled();
    });

    it('should return null when permission is not granted', async () => {
      mockHasPermission.mockResolvedValue(messaging.AuthorizationStatus.DENIED);

      const token = await pushNotificationService.getToken();

      expect(token).toBeNull();
      expect(mockGetToken).not.toHaveBeenCalled();
    });

    it('should return null when token retrieval fails', async () => {
      mockHasPermission.mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);
      mockGetToken.mockRejectedValue(new Error('Token error'));

      const token = await pushNotificationService.getToken();

      expect(token).toBeNull();
    });
  });

  describe('onNotificationReceived', () => {
    it('should register foreground notification handler', () => {
      const mockUnsubscribe = jest.fn();

      mockOnMessage.mockReturnValue(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = pushNotificationService.onNotificationReceived(callback);

      expect(mockOnMessage).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when foreground notification is received', async () => {
      const mockNotification = {
        messageId: 'test-message-id',
        notification: {
          title: 'Test Notification',
          body: 'Test Body',
        },
        data: {},
        fcmOptions: {},
      } as FirebaseMessagingTypes.RemoteMessage;

      let notificationHandler: ((message: FirebaseMessagingTypes.RemoteMessage) => void) | undefined;

      mockOnMessage.mockImplementation((handler: any) => {
        notificationHandler = handler;

        return jest.fn();
      });

      const callback = jest.fn();

      pushNotificationService.onNotificationReceived(callback);

      if (notificationHandler) {
        await notificationHandler(mockNotification);
      }

      expect(callback).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe('onNotificationOpened', () => {
    it('should register notification opened handler', () => {
      const mockUnsubscribe = jest.fn();

      mockOnNotificationOpenedApp.mockReturnValue(mockUnsubscribe);
      mockGetInitialNotification.mockResolvedValue(null);

      const callback = jest.fn();
      const unsubscribe = pushNotificationService.onNotificationOpened(callback);

      expect(mockOnNotificationOpenedApp).toHaveBeenCalled();
      expect(mockGetInitialNotification).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when notification is opened from background', () => {
      const mockNotification = {
        messageId: 'test-message-id',
        notification: {
          title: 'Test Notification',
          body: 'Test Body',
        },
        data: { screen: 'Wallet' },
        fcmOptions: {},
      } as FirebaseMessagingTypes.RemoteMessage;

      let notificationHandler: ((message: FirebaseMessagingTypes.RemoteMessage) => void) | undefined;

      mockOnNotificationOpenedApp.mockImplementation((handler: any) => {
        notificationHandler = handler;

        return jest.fn();
      });
      mockGetInitialNotification.mockResolvedValue(null);

      const callback = jest.fn();

      pushNotificationService.onNotificationOpened(callback);

      if (notificationHandler) {
        notificationHandler(mockNotification);
      }

      expect(callback).toHaveBeenCalledWith(mockNotification);
    });

    it('should call callback when app is opened from quit state via notification', async () => {
      const mockNotification = {
        messageId: 'test-message-id',
        notification: {
          title: 'Test Notification',
          body: 'Test Body',
        },
        data: { screen: 'Wallet' },
        fcmOptions: {},
      } as FirebaseMessagingTypes.RemoteMessage;

      mockOnNotificationOpenedApp.mockReturnValue(jest.fn());
      mockGetInitialNotification.mockResolvedValue(mockNotification);

      const callback = jest.fn();

      pushNotificationService.onNotificationOpened(callback);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe('onTokenRefresh', () => {
    it('should register token refresh handler', () => {
      const mockUnsubscribe = jest.fn();

      mockOnTokenRefresh.mockReturnValue(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = pushNotificationService.onTokenRefresh(callback);

      expect(mockOnTokenRefresh).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when token is refreshed', () => {
      const newToken = 'new-fcm-token-67890';

      let tokenRefreshHandler: ((token: string) => void) | undefined;

      mockOnTokenRefresh.mockImplementation((handler: any) => {
        tokenRefreshHandler = handler;

        return jest.fn();
      });

      const callback = jest.fn();

      pushNotificationService.onTokenRefresh(callback);

      if (tokenRefreshHandler) {
        tokenRefreshHandler(newToken);
      }

      expect(callback).toHaveBeenCalledWith(newToken);
    });
  });

  describe('navigation on tap', () => {
    it('should handle navigation data in notification', () => {
      const mockNotification = {
        messageId: 'test-message-id',
        notification: {
          title: 'Credential Issued',
          body: 'Your credential has been issued',
        },
        data: { screen: 'Wallet' },
        fcmOptions: {},
      } as FirebaseMessagingTypes.RemoteMessage;

      let notificationHandler: ((message: FirebaseMessagingTypes.RemoteMessage) => void) | undefined;

      mockOnNotificationOpenedApp.mockImplementation((handler: any) => {
        notificationHandler = handler;

        return jest.fn();
      });
      mockGetInitialNotification.mockResolvedValue(null);

      const callback = jest.fn();

      pushNotificationService.onNotificationOpened(callback);

      if (notificationHandler) {
        notificationHandler(mockNotification);
      }

      expect(callback).toHaveBeenCalledWith(mockNotification);
      expect(mockNotification.data?.screen).toBe('Wallet');
    });
  });
});
