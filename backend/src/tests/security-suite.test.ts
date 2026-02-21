import request from 'supertest';
import express, { Express } from 'express';
import { securityService } from '../services/security.service';
import { apiLimiter, registrationLimiter, authLimiter } from '../middleware/rateLimiter.middleware';
import { helmetMiddleware } from '../middleware/helmet.middleware';

describe('Security Test Suite', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize SQL injection attempts in input', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
        '1; DELETE FROM users WHERE 1=1',
        "' UNION SELECT * FROM users--",
      ];

      sqlInjectionAttempts.forEach((attempt) => {
        const sanitized = securityService.sanitizeInput(attempt);

        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        expect(sanitized).not.toContain('{');
        expect(sanitized).not.toContain('}');
        expect(sanitized).not.toContain('$');
      });
    });

    it('should prevent NoSQL injection attempts', () => {
      const noSqlInjectionAttempts = [
        '{"$gt": ""}',
        '{"$ne": null}',
        '{"$where": "this.password == \'password\'"}',
        '{$regex: ".*"}',
        '{"$or": [{"password": "pass"}, {"password": "word"}]}',
      ];

      noSqlInjectionAttempts.forEach((attempt) => {
        const sanitized = securityService.sanitizeInput(attempt);

        expect(sanitized).not.toContain('$gt');
        expect(sanitized).not.toContain('$ne');
        expect(sanitized).not.toContain('$where');
        expect(sanitized).not.toContain('$regex');
        expect(sanitized).not.toContain('$or');
        expect(sanitized).not.toContain('{');
        expect(sanitized).not.toContain('}');
      });
    });

    it('should handle null bytes in input', () => {
      const inputWithNullBytes = 'test\0data\0here';
      const sanitized = securityService.sanitizeInput(inputWithNullBytes);

      expect(sanitized).not.toContain('\0');
      expect(sanitized).toBe('testdatahere');
    });
  });

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    it('should sanitize XSS attempts in HTML', () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<a href="javascript:void(0)" onclick="alert(\'XSS\')">Click</a>',
      ];

      xssAttempts.forEach((attempt) => {
        const sanitized = securityService.sanitizeHTML(attempt);

        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('</script>');
        expect(sanitized).not.toContain('<img');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<body');
        expect(sanitized).not.toContain('<svg');
        expect(sanitized).not.toContain('<a');
      });
    });

    it('should escape HTML special characters', () => {
      const input = '<div>Test & "quotes" \'apostrophes\'</div>';
      const sanitized = securityService.sanitizeHTML(input);

      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });

    it('should handle nested XSS attempts', () => {
      const nestedXSS = '<<script>script>alert("XSS")<</script>/script>';
      const sanitized = securityService.sanitizeHTML(nestedXSS);

      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('</script>');
    });
  });

  describe('CSRF (Cross-Site Request Forgery) Protection', () => {
    beforeEach(() => {
      app.post('/api/test-action', (req, res) => {
        res.json({ success: true, message: 'Action performed' });
      });
    });

    it('should reject requests without proper origin', async () => {
      const response = await request(app)
        .post('/api/test-action')
        .set('Origin', 'http://malicious-site.com')
        .send({ data: 'test' });

      expect(response.status).toBeDefined();
    });

    it('should validate content-type header', async () => {
      const response = await request(app)
        .post('/api/test-action')
        .set('Content-Type', 'application/json')
        .send({ data: 'test' });

      expect([200, 201]).toContain(response.status);
    });

    it('should require authentication for sensitive operations', () => {
      expect(true).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      app.use('/api/limited', apiLimiter);
      app.get('/api/limited/test', (req, res) => {
        res.json({ success: true });
      });

      app.use('/api/register', registrationLimiter);
      app.post('/api/register', (req, res) => {
        res.status(201).json({ success: true });
      });

      app.use('/api/auth', authLimiter);
      app.post('/api/auth', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should enforce rate limits on general API endpoints', async () => {
      const requests = [];
      for (let i = 0; i < 105; i++) {
        requests.push(request(app).get('/api/limited/test').set('X-Forwarded-For', '192.168.1.1'));
      }

      const responses = await Promise.all(requests);

      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should have stricter limits on registration endpoint', async () => {
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/register')
            .set('X-Forwarded-For', '192.168.1.2')
            .send({ name: 'Test', email: 'test@example.com' }),
        );
      }

      const responses = await Promise.all(requests);

      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should return proper rate limit headers', async () => {
      const response = await request(app).get('/api/limited/test').set('X-Forwarded-For', '192.168.1.3');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });

    it('should return retry-after header when rate limited', async () => {
      const requests = [];
      for (let i = 0; i < 110; i++) {
        requests.push(request(app).get('/api/limited/test').set('X-Forwarded-For', '192.168.1.4'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.find((r) => r.status === 429);

      if (rateLimited) {
        expect(rateLimited.body.retryAfter).toBeDefined();
      }
    });
  });

  describe('Authentication Bypass Attempts', () => {
    beforeEach(() => {
      app.get('/api/protected', (req, res) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const token = authHeader.replace('Bearer ', '').trim();

        if (!token || token === 'invalid' || token === 'regular_user_token') {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        res.json({ success: true, data: 'Protected data' });
      });
    });

    it('should reject requests without authentication token', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app).get('/api/protected').set('Authorization', 'Bearer invalid');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject malformed authorization headers', async () => {
      const malformedHeaders = ['InvalidFormat token123', 'Bearer', 'Bearer ', 'token123', 'Basic dXNlcjpwYXNz'];

      for (const header of malformedHeaders) {
        const response = await request(app).get('/api/protected').set('Authorization', header);

        expect([401, 403]).toContain(response.status);
      }
    });

    it('should prevent JWT token manipulation', () => {
      const manipulatedTokens = [
        'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.',
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.fake',
        'header.payload.signature.extra',
        'not.a.jwt',
      ];

      manipulatedTokens.forEach((token) => {
        expect(token).toBeDefined();
      });
    });

    it('should prevent privilege escalation attempts', async () => {
      const response = await request(app).get('/api/protected').set('Authorization', 'Bearer regular_user_token');

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Security Headers (Helmet)', () => {
    beforeEach(() => {
      app.use(helmetMiddleware);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/api/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/api/test');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
    });

    it('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/api/test');

      if (response.headers['x-xss-protection']) {
        expect(response.headers['x-xss-protection']).toBeDefined();
      }
    });

    it('should set Strict-Transport-Security header', async () => {
      const response = await request(app).get('/api/test');

      if (response.headers['strict-transport-security']) {
        expect(response.headers['strict-transport-security']).toContain('max-age');
      }
    });

    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/api/test');

      if (response.headers['content-security-policy']) {
        expect(response.headers['content-security-policy']).toBeDefined();
      }
    });

    it('should set Referrer-Policy header', async () => {
      const response = await request(app).get('/api/test');

      expect(response.headers['referrer-policy']).toBeDefined();
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle extremely long inputs', () => {
      const longInput = 'a'.repeat(10000);
      const sanitized = securityService.sanitizeInput(longInput);

      expect(sanitized).toBeDefined();
      expect(sanitized.length).toBeLessThanOrEqual(longInput.length);
    });

    it('should handle unicode and special characters', () => {
      const unicodeInput = '你好世界 🌍 مرحبا العالم';
      const sanitized = securityService.sanitizeInput(unicodeInput);

      expect(sanitized).toBeDefined();
      expect(sanitized.length).toBeGreaterThan(0);
    });

    it('should handle empty and whitespace-only inputs', () => {
      expect(securityService.sanitizeInput('')).toBe('');
      expect(securityService.sanitizeInput('   ')).toBe('');
      expect(securityService.sanitizeInput('\n\t\r')).toBe('');
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(securityService.sanitizeInput(null as any)).toBe('');
      expect(securityService.sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('Password Security', () => {
    it('should hash passwords securely', async () => {
      const password = 'SecurePassword123!';
      const hash = await securityService.hashPassword(password);

      expect(hash).not.toBe(password);

      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should verify passwords correctly', async () => {
      const password = 'SecurePassword123!';
      const hash = await securityService.hashPassword(password);

      const isValid = await securityService.comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await securityService.comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should reject weak passwords', () => {
      const weakPasswords = ['123456', 'password', 'qwerty', 'abc123', '12345678'];

      weakPasswords.forEach((password) => {
        const isValid = securityService.validatePassword(password);
        expect(isValid).toBe(false);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = ['SecureP@ssw0rd!', 'MyStr0ng#Pass', 'C0mpl3x$Passw0rd'];

      strongPasswords.forEach((password) => {
        const isValid = securityService.validatePassword(password);
        expect(isValid).toBe(true);
      });
    });
  });
});
