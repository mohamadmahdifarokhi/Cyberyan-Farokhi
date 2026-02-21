import * as fc from 'fast-check';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

let capturedLogs: Array<{ level: string; message: string; context?: any }> = [];

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn((message: string, context?: any) => {
      capturedLogs.push({ level: 'INFO', message, context });
    }),
    debug: jest.fn((message: string, context?: any) => {
      capturedLogs.push({ level: 'DEBUG', message, context });
    }),
    error: jest.fn((message: string, error?: Error, context?: any) => {
      capturedLogs.push({ level: 'ERROR', message, context });
    }),
  },
}));

describe('API Service Logging Property-Based Tests', () => {
  beforeEach(() => {
    capturedLogs = [];
    jest.clearAllMocks();
  });

  describe('Property 9: API request logging', () => {
    it('should log HTTP method, URL, and request ID for any API request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.webUrl(),
          fc.record({
            data: fc.option(fc.object(), { nil: undefined }),
          }),
          async (method, url, options) => {
            const mock = new MockAdapter(axios);

            mock.onAny(url).reply(200, { success: true });

            try {
              await axios.request({
                method,
                url,
                ...options,
              });

              const requestLogs = capturedLogs.filter(
                (log) => log.message.includes('[API]') && log.message.includes(method),
              );

              expect(requestLogs.length).toBeGreaterThan(0);

              const requestLog = requestLogs[0];

              expect(requestLog.message).toContain(method);

              if (requestLog.context) {
                expect(requestLog.context).toHaveProperty('requestId');
                expect(typeof requestLog.context.requestId).toBe('string');
                expect(requestLog.context.requestId.length).toBeGreaterThan(0);
              }
            } finally {
              mock.restore();
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 10: API response logging', () => {
    it('should log status code, response time, and request ID for any API response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('GET', 'POST'),
          fc.webUrl(),
          fc.integer({ min: 200, max: 299 }),
          async (method, url, status) => {
            const mock = new MockAdapter(axios);

            mock.onAny(url).reply(status, { success: true });

            try {
              await axios.request({
                method,
                url,
              });

              const responseLogs = capturedLogs.filter(
                (log) => log.message.includes('[API]') && log.message.includes(status.toString()),
              );

              expect(responseLogs.length).toBeGreaterThan(0);

              const responseLog = responseLogs[0];

              expect(responseLog.message).toContain(status.toString());

              if (responseLog.context) {
                expect(responseLog.context).toHaveProperty('requestId');
                expect(responseLog.context).toHaveProperty('duration');
                expect(responseLog.context).toHaveProperty('status');
                expect(responseLog.context.status).toBe(status);
              }
            } finally {
              mock.restore();
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 11: API error logging', () => {
    it('should log error message and status code for failed API requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('GET', 'POST'),
          fc.webUrl(),
          fc.integer({ min: 400, max: 599 }),
          async (method, url, status) => {
            const mock = new MockAdapter(axios);

            mock.onAny(url).reply(status, { error: 'Request failed' });

            try {
              await axios.request({
                method,
                url,
              });
            } catch {}

            const errorLogs = capturedLogs.filter((log) => log.level === 'ERROR' && log.message.includes('[API]'));

            expect(errorLogs.length).toBeGreaterThan(0);

            const errorLog = errorLogs[0];

            expect(errorLog.message).toContain(status.toString());

            if (errorLog.context) {
              expect(errorLog.context).toHaveProperty('status');
              expect(errorLog.context).toHaveProperty('message');
            }

            mock.restore();
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 12: Sensitive data redaction', () => {
    it('should redact sensitive data patterns in API request logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.string({ minLength: 1, maxLength: 20 }),
            password: fc.string({ minLength: 8, maxLength: 20 }),
            token: fc.string({ minLength: 10, maxLength: 50 }),
            apiKey: fc.string({ minLength: 10, maxLength: 50 }),
          }),
          async (sensitiveData) => {
            const mock = new MockAdapter(axios);
            const url = 'http://example.com/api/test';

            mock.onPost(url).reply(200, { success: true });

            try {
              await axios.post(url, sensitiveData);

              const debugLogs = capturedLogs.filter((log) => log.level === 'DEBUG' && log.message.includes('[API]'));

              debugLogs.forEach((log) => {
                const logString = JSON.stringify(log);

                expect(logString).not.toContain(sensitiveData.password);
                expect(logString).not.toContain(sensitiveData.token);
                expect(logString).not.toContain(sensitiveData.apiKey);

                if (log.context && log.context.data) {
                  const data = log.context.data;

                  if (data.password !== undefined) {
                    expect(data.password).toBe('[REDACTED]');
                  }
                  if (data.token !== undefined) {
                    expect(data.token).toBe('[REDACTED]');
                  }
                  if (data.apiKey !== undefined) {
                    expect(data.apiKey).toBe('[REDACTED]');
                  }
                }
              });
            } finally {
              mock.restore();
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 13: Request correlation', () => {
    it('should use the same request ID for request and response logs', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom('GET', 'POST'), fc.webUrl(), async (method, url) => {
          const mock = new MockAdapter(axios);

          mock.onAny(url).reply(200, { success: true });

          try {
            await axios.request({
              method,
              url,
            });

            const apiLogs = capturedLogs.filter((log) => log.message.includes('[API]') && log.context?.requestId);

            expect(apiLogs.length).toBeGreaterThanOrEqual(2);

            const requestIds = apiLogs.map((log) => log.context?.requestId);

            const uniqueRequestIds = new Set(requestIds);

            expect(uniqueRequestIds.size).toBe(1);
          } finally {
            mock.restore();
          }
        }),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 24: API duration logging', () => {
    it('should include request duration in milliseconds for any completed API call', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom('GET', 'POST'), fc.webUrl(), async (method, url) => {
          const mock = new MockAdapter(axios);

          mock.onAny(url).reply(() => {
            return new Promise((resolve) => {
              setTimeout(() => resolve([200, { success: true }]), 10);
            });
          });

          try {
            await axios.request({
              method,
              url,
            });

            const responseLogs = capturedLogs.filter(
              (log) => log.message.includes('[API]') && log.message.includes('200') && log.context?.duration,
            );

            expect(responseLogs.length).toBeGreaterThan(0);

            const responseLog = responseLogs[0];

            expect(responseLog.context).toHaveProperty('duration');
            expect(responseLog.context.duration).toMatch(/\d+ms/);

            const durationMatch = responseLog.context.duration.match(/(\d+)ms/);

            expect(durationMatch).not.toBeNull();

            if (durationMatch) {
              const duration = parseInt(durationMatch[1], 10);

              expect(duration).toBeGreaterThanOrEqual(0);
            }
          } finally {
            mock.restore();
          }
        }),
        { numRuns: 20 },
      );
    });
  });
});
