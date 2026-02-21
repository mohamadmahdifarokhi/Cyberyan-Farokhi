import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { apiService } from '../services/api';
import { Alert } from 'react-native';

jest.mock('../services/api');
jest.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    setCredentials: jest.fn(),
    setJWT: jest.fn(),
    addAuditLog: jest.fn(),
    biometricAvailable: false,
    setBiometricEnabled: jest.fn(),
    fcmToken: null,
    registerFCMToken: jest.fn(),
  }),
}));

jest.spyOn(Alert, 'alert');

describe('Registration Screen Unit Tests', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render password fields', () => {
    const { getByPlaceholderText } = render(<RegistrationScreen navigation={mockNavigation} />);

    const passwordInput = getByPlaceholderText('Enter your password (min 8 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');

    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
  });

  it('should have secure text entry for password fields', () => {
    const { getByPlaceholderText } = render(<RegistrationScreen navigation={mockNavigation} />);

    const passwordInput = getByPlaceholderText('Enter your password (min 8 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');

    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
  });

  it('should show validation error for short password', async () => {
    const { getByText, getByPlaceholderText } = render(<RegistrationScreen navigation={mockNavigation} />);

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password (min 8 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');
    const registerButton = getByText('Register');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'short');
    fireEvent.changeText(confirmPasswordInput, 'short');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters')).toBeTruthy();
    });
  });

  it('should show validation error when passwords do not match', async () => {
    const { getByText, getByPlaceholderText } = render(<RegistrationScreen navigation={mockNavigation} />);

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password (min 8 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');
    const registerButton = getByText('Register');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password456');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('should include password in registration submission', async () => {
    const mockRegisterUser = jest.fn().mockResolvedValue({
      did: 'did:example:123',
      vc: {} as any,
      jwt: 'mock-jwt',
      email: 'test@example.com',
      auditHash: 'hash123',
    });

    (apiService.registerUser as jest.Mock) = mockRegisterUser;

    const { getByText, getByPlaceholderText } = render(<RegistrationScreen navigation={mockNavigation} />);

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password (min 8 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');
    const registerButton = getByText('Register');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      );
    });
  });

  it('should show error alert on registration failure', async () => {
    const mockRegisterUser = jest.fn().mockRejectedValue(new Error('Registration failed'));

    (apiService.registerUser as jest.Mock) = mockRegisterUser;

    const { getByText, getByPlaceholderText } = render(<RegistrationScreen navigation={mockNavigation} />);

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password (min 8 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');
    const registerButton = getByText('Register');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Registration failed. Please try again.');
    });
  });

  it('should show specific alert when email is already registered', async () => {
    const mockError = new Error('Email already registered') as any;

    mockError.response = {
      status: 409,
      data: { error: 'Email already registered' },
    };
    const mockRegisterUser = jest.fn().mockRejectedValue(mockError);

    (apiService.registerUser as jest.Mock) = mockRegisterUser;

    const { getByText, getByPlaceholderText } = render(<RegistrationScreen navigation={mockNavigation} />);

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password (min 8 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');
    const registerButton = getByText('Register');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'existing@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Already Registered',
        'This email is already registered. Please use a different email or login to your existing account.',
      );
    });
  });
});
