import * as fc from 'fast-check';
import express, { Express } from 'express';
import request from 'supertest';
import { apiLimiter, registrationLimiter, createRateLimiter } from '../middleware/rateLimiter.middleware';
import { helmetMiddleware } from '../middleware/helmet.middleware';

describe('Middleware - Property-Based Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Property 4: Rate limiting enforcement', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      const testLimiter = createRateLimiter({
        windowMs: 60000,
        max: 3,
        message: 'Rate limit exceeded',
      });

      app.use('/test', testLimiter);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      for (let i = 0; i < 3; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }

      const response = await request(app).get('/test');
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Rate limit exceeded');
    });

    it('should enforce different limits for different endpoints', async () => {
      const limiter1 = createRateLimiter({ windowMs: 60000, max: 2, message: 'Limit 1' });
      const limiter2 = createRateLimiter({ windowMs: 60000, max: 5, message: 'Limit 2' });

      app.use('/endpoint1', limiter1);
      app.get('/endpoint1', (req, res) => res.json({ endpoint: 1 }));

      app.use('/endpoint2', limiter2);
      app.get('/endpoint2', (req, res) => res.json({ endpoint: 2 }));

      await request(app).get('/endpoint1').expect(200);
      await request(app).get('/endpoint1').expect(200);
      await request(app).get('/endpoint1').expect(429);

      await request(app).get('/endpoint2').expect(200);
      await request(app).get('/endpoint2').expect(200);
      await request(app).get('/endpoint2').expect(200);
    });

    it('should include retry-after information in rate limit response', async () => {
      const testLimiter = createRateLimiter({
        windowMs: 60000,
        max: 1,
        message: 'Too many requests',
      });

      app.use('/test', testLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      await request(app).get('/test').expect(200);

      const response = await request(app).get('/test').expect(429);
      expect(response.body).toHaveProperty('retryAfter');
      expect(typeof response.body.retryAfter).toBe('number');
    });

    it('should handle concurrent requests correctly', async () => {
      const testLimiter = createRateLimiter({
        windowMs: 60000,
        max: 5,
        message: 'Rate limit',
      });

      app.use('/test', testLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get('/test'));
      const responses = await Promise.all(requests);

      const successCount = responses.filter((r) => r.status === 200).length;
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;

      expect(successCount).toBe(5);
      expect(rateLimitedCount).toBe(5);
    });
  });

  describe('Property 5: Security headers presence', () => {
    beforeEach(() => {
      app.use(helmetMiddleware);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should include security headers in all responses', async () => {
      const response = await request(app).get('/test');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers['x-frame-options']).toBe('DENY');

      expect(response.headers).toHaveProperty('x-xss-protection');

      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    it('should include CSP headers', async () => {
      const response = await request(app).get('/test');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should include referrer policy', async () => {
      const response = await request(app).get('/test');
      expect(response.headers).toHaveProperty('referrer-policy');
    });

    it('should set security headers for different response types', async () => {
      app.post('/post-test', (req, res) => res.json({ success: true }));
      app.put('/put-test', (req, res) => res.json({ success: true }));
      app.delete('/delete-test', (req, res) => res.json({ success: true }));

      const getResponse = await request(app).get('/test');
      const postResponse = await request(app).post('/post-test');
      const putResponse = await request(app).put('/put-test');
      const deleteResponse = await request(app).delete('/delete-test');

      [getResponse, postResponse, putResponse, deleteResponse].forEach((response) => {
        expect(response.headers).toHaveProperty('x-content-type-options');
        expect(response.headers).toHaveProperty('x-frame-options');
      });
    });

    it('should set HSTS header with correct max-age', async () => {
      const response = await request(app).get('/test');
      const hstsHeader = response.headers['strict-transport-security'];

      expect(hstsHeader).toBeDefined();
      expect(hstsHeader).toContain('max-age=31536000');
      expect(hstsHeader).toContain('includeSubDomains');
    });
  });

  describe('Combined middleware behavior', () => {
    it('should apply both rate limiting and security headers', async () => {
      const testLimiter = createRateLimiter({
        windowMs: 60000,
        max: 2,
        message: 'Rate limit',
      });

      app.use(helmetMiddleware);
      app.use('/test', testLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response1 = await request(app).get('/test');
      expect(response1.status).toBe(200);
      expect(response1.headers).toHaveProperty('x-content-type-options');

      const response2 = await request(app).get('/test');
      expect(response2.status).toBe(200);
      expect(response2.headers).toHaveProperty('x-content-type-options');

      const response3 = await request(app).get('/test');
      expect(response3.status).toBe(429);
      expect(response3.headers).toHaveProperty('x-content-type-options');
    });
  });
});
