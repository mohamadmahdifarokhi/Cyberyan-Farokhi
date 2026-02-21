/**
 * Mock Data for E2E Tests
 * Provides test data for E2E test scenarios
 */

export interface TestUser {
  name: string;
  email: string;
  did?: string;
}

export interface TestCredential {
  did: string;
  vc: {
    '@context': string[];
    type: string[];
    credentialSubject: {
      id: string;
      name: string;
      email: string;
    };
  };
  jwt: string;
}

/**
 * Generate test user data
 */
export function generateTestUser(index: number = 1): TestUser {
  return {
    name: `Test User ${index}`,
    email: `testuser${index}@example.com`,
  };
}

/**
 * Generate multiple test users
 */
export function generateTestUsers(count: number): TestUser[] {
  return Array.from({ length: count }, (_, i) => generateTestUser(i + 1));
}

/**
 * Generate test DID
 */
export function generateTestDID(index: number = 1): string {
  return `did:example:test${index}${Date.now()}`;
}

/**
 * Generate test credential
 */
export function generateTestCredential(user: TestUser, did: string): TestCredential {
  return {
    did,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
      type: ['VerifiableCredential', 'UniversityDegreeCredential'],
      credentialSubject: {
        id: did,
        name: user.name,
        email: user.email,
      },
    },
    jwt: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test${Date.now()}.signature`,
  };
}

/**
 * Test data constants
 */
export const TEST_DATA = {
  validUser: {
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
  invalidUser: {
    name: '',
    email: 'invalid-email',
  },
  searchQueries: {
    valid: 'John',
    noResults: 'NonExistentUser123',
    partial: 'Doe',
  },
  notifications: {
    credentialIssued: {
      title: 'Credential Issued',
      body: 'Your credential has been successfully issued',
    },
  },
};

/**
 * API endpoints for E2E tests
 */
export const TEST_API_ENDPOINTS = {
  register: '/api/register',
  credentials: '/api/credentials',
  auditLogs: '/api/audit-logs',
  analytics: '/api/analytics',
  health: '/api/health',
  export: '/api/credentials/export',
  notificationToken: '/api/notifications/register-token',
};

/**
 * Test timeouts
 */
export const TEST_TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  veryLong: 60000,
};
