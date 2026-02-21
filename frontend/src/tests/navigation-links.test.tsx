import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';

jest.mock('../services/api');
jest.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    setJWT: jest.fn(),
    setCredentials: jest.fn(),
    addAuditLog: jest.fn(),
    biometricAvailable: false,
    setBiometricEnabled: jest.fn(),
    fcmToken: null,
    registerFCMToken: jest.fn(),
  }),
}));

describe('Navigation Links Unit Tests', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Screen', () => {
    it('should have link to Register screen', () => {
      const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

      const registerLink = getByText(/Don't have an account\?/);

      expect(registerLink).toBeTruthy();
    });

    it('should navigate to Register when link is tapped', () => {
      const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

      const registerLink = getByText(/Don't have an account\?/);

      fireEvent.press(registerLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
    });
  });

  describe('Registration Screen', () => {
    it('should have link to Login screen', () => {
      const { getByText } = render(<RegistrationScreen navigation={mockNavigation} />);

      const loginLink = getByText(/Already have an account\?/);

      expect(loginLink).toBeTruthy();
    });

    it('should navigate to Login when link is tapped', () => {
      const { getByText } = render(<RegistrationScreen navigation={mockNavigation} />);

      const loginLink = getByText(/Already have an account\?/);

      fireEvent.press(loginLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Bidirectional Navigation', () => {
    it('should allow navigation from Login to Register and back', () => {
      const { getByText: getByTextLogin } = render(<LoginScreen navigation={mockNavigation} />);

      const registerLink = getByTextLogin(/Don't have an account\?/);

      fireEvent.press(registerLink);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');

      mockNavigation.navigate.mockClear();

      const { getByText: getByTextRegister } = render(<RegistrationScreen navigation={mockNavigation} />);

      const loginLink = getByTextRegister(/Already have an account\?/);

      fireEvent.press(loginLink);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });
});
