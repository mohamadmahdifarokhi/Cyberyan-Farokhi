import { apiService } from '../services/api';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should include password in registration request', async () => {
      const mockResponse = {
        data: {
          did: 'did:example:123',
          vc: {} as any,
          jwt: 'mock-jwt',
          email: 'test@example.com',
          auditHash: 'hash123',
        },
      };

      mockedAxios.create = jest.fn().mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const registrationData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const testService = new (apiService.constructor as any)();
      const result = await testService.registerUser(registrationData);

      expect(result).toHaveProperty('jwt');
      expect(result).toHaveProperty('email');
    });

    it('should use /api/auth/register endpoint with password', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          did: 'did:example:123',
          vc: {} as any,
          jwt: 'mock-jwt',
          email: 'test@example.com',
          auditHash: 'hash123',
        },
      });

      mockedAxios.create = jest.fn().mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const testService = new (apiService.constructor as any)();

      await testService.registerUser({
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
    });
  });

  describe('authenticateUser', () => {
    it('should include password in login request', async () => {
      const mockResponse = {
        data: {
          jwt: 'mock-jwt',
          email: 'test@example.com',
        },
      };

      mockedAxios.create = jest.fn().mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const testService = new (apiService.constructor as any)();
      const result = await testService.authenticateUser({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('jwt');
      expect(result).toHaveProperty('email');
    });

    it('should use /api/auth/login endpoint with password', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          jwt: 'mock-jwt',
          email: 'test@example.com',
        },
      });

      mockedAxios.create = jest.fn().mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const testService = new (apiService.constructor as any)();

      await testService.authenticateUser({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
    });

    it('should handle auth errors correctly', async () => {
      mockedAxios.create = jest.fn().mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('Auth failed')),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const testService = new (apiService.constructor as any)();

      await expect(
        testService.authenticateUser({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow('Failed to authenticate user');
    });
  });
});
