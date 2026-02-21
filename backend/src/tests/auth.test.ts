import { Request, Response } from 'express';
import { authHandler } from '../routes/auth';

describe('Auth Endpoint', () => {
  const mockResponse = () => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  it('should generate JWT for valid email', async () => {
    const req = {
      body: { email: 'test@example.com' },
    } as Request;
    const res = mockResponse();

    await authHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response.jwt).toBeDefined();
    expect(typeof response.jwt).toBe('string');
  });

  it('should return 400 when email is missing', async () => {
    const req = {
      body: {},
    } as Request;
    const res = mockResponse();

    await authHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
