import * as fc from 'fast-check';
import { Request, Response } from 'express';
import { registerHandler } from '../routes/register';

describe('Register Endpoint', () => {
  const mockResponse = () => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  describe('Property 7: Registration response completeness', () => {
    it('should return complete response with did, vc, jwt, auditHash', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), fc.emailAddress(), async (name, email) => {
          const req = {
            body: { name, email },
          } as Request;
          const res = mockResponse();

          await registerHandler(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          const jsonCall = (res.json as jest.Mock).mock.calls[0][0];

          return (
            typeof jsonCall.did === 'string' &&
            typeof jsonCall.vc === 'object' &&
            typeof jsonCall.jwt === 'string' &&
            typeof jsonCall.auditHash === 'string' &&
            jsonCall.auditHash.length === 64
          );
        }),
      );
    });
  });

  describe('Property 19: API responses are valid JSON', () => {
    it('should return valid JSON response', async () => {
      const req = {
        body: { name: 'Test User', email: 'test@example.com' },
      } as Request;
      const res = mockResponse();

      await registerHandler(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = (res.json as jest.Mock).mock.calls[0][0];

      expect(() => JSON.stringify(response)).not.toThrow();
    });
  });

  it('should return 400 when name is missing', async () => {
    const req = {
      body: { email: 'test@example.com' },
    } as Request;
    const res = mockResponse();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 when email is missing', async () => {
    const req = {
      body: { name: 'Test User' },
    } as Request;
    const res = mockResponse();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
