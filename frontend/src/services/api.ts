import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  RegistrationRequest,
  RegistrationResponse,
  AuthRequest,
  AuthResponse,
  AnalyticsMetrics,
  SystemHealth,
} from '../types';
import { logger } from '../utils/logger';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}

const API_BASE_URL = 'http://localhost:3001';
const API_TIMEOUT = 10000;
const SENSITIVE_PATTERNS = [/password/i, /token/i, /authorization/i, /secret/i, /apikey/i, /api_key/i];

function redactSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const redacted = Array.isArray(data) ? [...data] : { ...(data as Record<string, unknown>) };

  for (const key in redacted) {
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}

class APIService {
  private client: AxiosInstance;

  private jwtToken: string | null = null;

  private logApiRequests: boolean = true;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (typeof process !== 'undefined' && process.env) {
      this.logApiRequests = process.env.LOG_API_REQUESTS !== 'false';
    }
    this.client.interceptors.request.use(
      (config) => {
        const requestId = generateUUID();

        config.headers['X-Request-ID'] = requestId;
        if (this.jwtToken) {
          config.headers.Authorization = `Bearer ${this.jwtToken}`;
        }
        if (this.logApiRequests) {
          const method = config.method?.toUpperCase() || 'GET';
          const url = config.url || '';

          logger.info(`[API] ${method} ${url}`, {
            requestId,
            method,
            url,
          });
          if (config.data) {
            logger.debug(`[API] Request data for ${requestId}`, {
              data: redactSensitiveData(config.data),
            });
          }
        }
        (config as { metadata?: { startTime: number; requestId: string } }).metadata = {
          startTime: Date.now(),
          requestId,
        };

        return config;
      },
      (error) => {
        logger.error('[API] Request interceptor error', error);

        return Promise.reject(error);
      },
    );
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.logApiRequests) {
          const config = response.config as { metadata?: { requestId: string; startTime: number } };
          const requestId = config.metadata?.requestId || 'unknown';
          const duration = config.metadata?.startTime ? Date.now() - config.metadata.startTime : 0;

          logger.info(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            requestId,
            status: response.status,
            duration: `${duration}ms`,
          });
        }

        return response;
      },
      (error: AxiosError) => {
        if (this.logApiRequests) {
          const config = error.config as { metadata?: { requestId: string; startTime: number } } | undefined;
          const requestId = config?.metadata?.requestId || 'unknown';
          const duration = config?.metadata?.startTime ? Date.now() - config.metadata.startTime : 0;
          const status = error.response?.status || 'N/A';
          const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
          const url = error.config?.url || 'unknown';

          logger.error(`[API] ${status} ${method} ${url}`, error, {
            requestId,
            status,
            duration: `${duration}ms`,
            message: error.message,
          });
        }

        return Promise.reject(error);
      },
    );
  }

  setJWT(token: string | null): void {
    this.jwtToken = token;
  }

  async registerUser(data: RegistrationRequest): Promise<RegistrationResponse> {
    try {
      const endpoint = data.password ? '/api/auth/register' : '/api/register';
      const response = await this.client.post<RegistrationResponse>(endpoint, data);

      return response.data;
    } catch (error: unknown) {
      console.error('Registration error in API service:', error);
      const err = error as { response?: { status?: number; data?: { error?: string } } };

      console.error('Error response:', err.response);
      console.error('Error response status:', err.response?.status);
      console.error('Error response data:', err.response?.data);
      if (err.response?.data?.error) {
        const backendError = new Error(err.response.data.error) as Error & { response?: unknown };

        backendError.response = err.response;
        throw backendError;
      }
      throw error;
    }
  }

  async authenticateUser(data: AuthRequest): Promise<AuthResponse> {
    try {
      const endpoint = data.password ? '/api/auth/login' : '/api/auth';
      const response = await this.client.post<AuthResponse>(endpoint, data);

      return response.data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Failed to authenticate user');
    }
  }

  async registerFCMToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
    try {
      await this.client.post('/api/notifications/register-token', {
        userId,
        token,
        platform,
      });
      console.log('FCM token registered successfully');
    } catch (error) {
      console.error('Error registering FCM token:', error);
      throw new Error('Failed to register FCM token');
    }
  }

  async getAnalytics(): Promise<AnalyticsMetrics> {
    try {
      const response = await this.client.get<{ success: boolean; data: AnalyticsMetrics }>('/api/analytics');

      return response.data.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await this.client.get<SystemHealth>('/api/health');

      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw new Error('Failed to fetch system health');
    }
  }
}

export const apiService = new APIService();
