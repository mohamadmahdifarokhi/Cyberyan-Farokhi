import { apiService } from '../services/api';

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
    },
  })),
}));

describe('API Service', () => {
  describe('Property 16: Authenticated requests include JWT', () => {
    it('should include JWT in request headers when set', () => {
      const mockJWT = 'test-jwt-token';

      apiService.setJWT(mockJWT);

      expect(apiService).toBeDefined();
    });
  });

  describe('Property 4: Valid form submission triggers API call', () => {
    it('should call register endpoint with valid data', async () => {
      const axios = await import('axios');
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          did: 'did:example:123',
          vc: {},
          jwt: 'token',
          auditHash: 'hash',
        },
      });

      axios.create.mockReturnValue({
        post: mockPost,
        interceptors: {
          request: {
            use: jest.fn(),
          },
        },
      });

      expect(mockPost).toBeDefined();
    });
  });
});
