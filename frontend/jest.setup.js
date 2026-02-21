// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667 }),
    addEventListener: () => ({ remove: () => {} }),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock react-native-biometrics
jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isSensorAvailable: jest.fn(() => Promise.resolve({ available: true, biometryType: 'FaceID' })),
    createKeys: jest.fn(() => Promise.resolve({ publicKey: 'mock-public-key' })),
    deleteKeys: jest.fn(() => Promise.resolve({ keysDeleted: true })),
    createSignature: jest.fn(() => Promise.resolve({ success: true, signature: 'mock-signature' })),
    simplePrompt: jest.fn(() => Promise.resolve({ success: true })),
  })),
  BiometryTypes: {
    FaceID: 'FaceID',
    TouchID: 'TouchID',
    Biometrics: 'Biometrics',
  },
}));

// Mock AsyncStorage
const mockStorage = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key, value) => {
    mockStorage[key] = value;

    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockStorage[key] || null);
  }),
  removeItem: jest.fn((key) => {
    delete mockStorage[key];

    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

    return Promise.resolve();
  }),
}));

// Mock Firebase
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onTokenRefresh: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
  })),
}));
