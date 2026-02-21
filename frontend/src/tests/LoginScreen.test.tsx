import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { apiService } from '../services/api';
import { Alert } from 'react-native';

jest.mock('../services/api');
jest.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    setJWT: jest.fn(),
  }),
}));

jest.spyOn(Alert, 'alert');

describe('Login Screen Unit Tests', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render password field', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);

    const passwordInput = getByPlaceholderText('Enter your password');

    expect(passwordInput).toBeTruthy();
  });

  it('should have secure text entry for password field', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);

    const passwordInput = getByPlaceholderText('Enter your password');

    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('should show validation error when password is empty', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);

    const emailInput = getByPlaceholderText('Enter your email');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('should include password in login submission', async () => {
    const mockAuthenticateUser = jest.fn().mockResolvedValue({
      jwt: 'mock-jwt',
      email: 'test@example.com',
    });

    (apiService.authenticateUser as jest.Mock) = mockAuthenticateUser;

    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAuthenticateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show error alert on authentication failure', async () => {
    const mockAuthenticateUser = jest.fn().mockRejectedValue(new Error('Auth failed'));

    (apiService.authenticateUser as jest.Mock) = mockAuthenticateUser;

    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Authentication failed. Please try again.');
    });
  });
});
