import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Alert } from 'react-native';

const mockClearCredentials = jest.fn();
const mockNavigationReset = jest.fn();

jest.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    isDarkMode: false,
    setDarkMode: jest.fn(),
    biometricEnabled: false,
    setBiometricEnabled: jest.fn(),
    biometricAvailable: true,
    clearCredentials: mockClearCredentials,
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyMTIzIiwiaWF0IjoxNjE2MjM5MDIyfQ.test',
  }),
}));

jest.spyOn(Alert, 'alert');

describe('Settings Screen Logout Tests', () => {
  const mockNavigation = {
    reset: mockNavigationReset,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render logout button', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);

    expect(getByText('Logout')).toBeTruthy();
  });

  it('should display user email', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);

    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('should show confirmation dialog when logout is pressed', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);

    const logoutButton = getByText('Logout');

    fireEvent.press(logoutButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Logout',
      'Are you sure you want to logout?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Logout' }),
      ]),
    );
  });

  it('should clear credentials on logout confirmation', async () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);

    const logoutButton = getByText('Logout');

    fireEvent.press(logoutButton);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const logoutCallback = alertCall[2][1].onPress;

    await logoutCallback();

    expect(mockClearCredentials).toHaveBeenCalled();
  });

  it('should navigate to Login screen after logout', async () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);

    const logoutButton = getByText('Logout');

    fireEvent.press(logoutButton);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const logoutCallback = alertCall[2][1].onPress;

    await logoutCallback();

    await waitFor(() => {
      expect(mockNavigationReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    });
  });

  it('should not logout when cancel is pressed', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);

    const logoutButton = getByText('Logout');

    fireEvent.press(logoutButton);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const cancelButton = alertCall[2][0];

    expect(cancelButton.style).toBe('cancel');
    expect(mockClearCredentials).not.toHaveBeenCalled();
  });
});
