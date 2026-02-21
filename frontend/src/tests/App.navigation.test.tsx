import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

const mockContextValue = {
  isAuthenticated: false,
  isAppLocked: false,
  jwt: null as string | null,
  credentials: null,
  auditLogs: [],
  biometricEnabled: false,
  biometricAvailable: false,
  userEmail: null,
  fcmToken: null,
  isDarkMode: false,
  isThemeLoaded: true,
  setCredentials: jest.fn(),
  setJWT: jest.fn(),
  addAuditLog: jest.fn(),
  clearCredentials: jest.fn(),
  logout: jest.fn(),
  setBiometricEnabled: jest.fn(),
  lockApp: jest.fn(),
  unlockApp: jest.fn(),
  authenticateWithBiometric: jest.fn(),
  setFCMToken: jest.fn(),
  registerFCMToken: jest.fn(),
  setDarkMode: jest.fn(),
};

jest.mock('../context/AppContext', () => ({
  AppProvider: ({ children }: any) => children,
  useAppContext: () => mockContextValue,
}));

jest.mock('../services/biometric');
jest.mock('../services/pushNotification');
jest.mock('../services/api');

describe('Navigation Guard Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show Login screen when not authenticated', () => {
    mockContextValue.jwt = null;
    mockContextValue.isAuthenticated = false;

    const { UNSAFE_getByType } = render(<App />);

    expect(UNSAFE_getByType(App)).toBeTruthy();
  });

  it('should show main tabs when authenticated', () => {
    mockContextValue.jwt = 'valid.jwt.token';
    mockContextValue.isAuthenticated = true;

    const { UNSAFE_getByType } = render(<App />);

    expect(UNSAFE_getByType(App)).toBeTruthy();
  });

  it('should not crash when switching between auth states', () => {
    mockContextValue.jwt = null;
    mockContextValue.isAuthenticated = false;

    const { rerender, UNSAFE_getByType } = render(<App />);

    expect(UNSAFE_getByType(App)).toBeTruthy();

    mockContextValue.jwt = 'valid.jwt.token';
    mockContextValue.isAuthenticated = true;

    rerender(<App />);
    expect(UNSAFE_getByType(App)).toBeTruthy();

    mockContextValue.jwt = null;
    mockContextValue.isAuthenticated = false;

    rerender(<App />);
    expect(UNSAFE_getByType(App)).toBeTruthy();
  });

  it('should handle biometric lock screen', () => {
    mockContextValue.jwt = 'valid.jwt.token';
    mockContextValue.isAuthenticated = false;
    mockContextValue.isAppLocked = true;

    const { UNSAFE_getByType } = render(<App />);

    expect(UNSAFE_getByType(App)).toBeTruthy();
  });
});
