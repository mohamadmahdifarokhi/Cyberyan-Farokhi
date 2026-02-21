import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppProvider, useAppContext } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../services/biometric');
jest.mock('../services/pushNotification');
jest.mock('../services/api');

describe('AppContext Enhancements Unit Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;

  it('should set isAuthenticated to true when JWT exists', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isThemeLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setJWT('test.jwt.token');
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should set isAuthenticated to false when JWT is null', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isThemeLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setJWT('test.jwt.token');
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.setJWT(null);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should clear all authentication data on logout', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isThemeLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setJWT('test.jwt.token');
      await result.current.setCredentials({ did: 'did:test:123', vc: {} as any });
      result.current.addAuditLog({ hash: 'test', timestamp: new Date().toISOString(), operation: 'test' });
    });

    expect(result.current.jwt).toBe('test.jwt.token');
    expect(result.current.credentials).toBeTruthy();
    expect(result.current.auditLogs.length).toBeGreaterThan(0);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.jwt).toBeNull();
    expect(result.current.credentials).toBeNull();
    expect(result.current.auditLogs.length).toBe(0);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should extract userEmail from JWT', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isThemeLoaded).toBe(true);
    });

    const mockPayload = { email: 'test@example.com', sub: 'user123', iat: Date.now() };
    const mockJWT = `header.${btoa(JSON.stringify(mockPayload))}.signature`;

    await act(async () => {
      await result.current.setJWT(mockJWT);
    });

    expect(result.current.userEmail).toBe('test@example.com');
  });

  it('should return null userEmail when JWT is invalid', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isThemeLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setJWT('invalid.jwt');
    });

    expect(result.current.userEmail).toBeNull();
  });

  it('should return null userEmail when JWT is null', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isThemeLoaded).toBe(true);
    });

    expect(result.current.userEmail).toBeNull();
  });
});
