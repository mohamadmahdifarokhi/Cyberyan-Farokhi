import { faker } from '@faker-js/faker';
import { ICredential } from '../../models/Credential.model';
import { IAuditLog } from '../../models/AuditLog.model';

export function generateDID(): string {
  return `did:example:${faker.string.alphanumeric(32)}`;
}

export function generateTestCredential(overrides?: Partial<ICredential>): Partial<ICredential> {
  return {
    did: generateDID(),
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: `did:example:issuer-${faker.string.alphanumeric(16)}`,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: generateDID(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
      },
    },
    userInfo: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passportImage: faker.image.url(),
      selfieImage: faker.image.url(),
    },
    jwt: faker.string.alphanumeric(128),
    ...overrides,
  };
}

export function generateTestAuditLog(overrides?: Partial<IAuditLog>): Partial<IAuditLog> {
  return {
    did: generateDID(),
    hash: faker.string.alphanumeric(64),
    operation: faker.helpers.arrayElement(['CREATE', 'READ', 'UPDATE', 'DELETE']),
    timestamp: new Date(),
    metadata: {
      userId: faker.string.uuid(),
      ipAddress: faker.internet.ip(),
    },
    processingTime: faker.number.int({ min: 10, max: 1000 }),
    ...overrides,
  };
}

export function generateTestCredentials(count: number): Partial<ICredential>[] {
  return Array.from({ length: count }, () => generateTestCredential());
}

export function generateTestAuditLogs(count: number): Partial<IAuditLog>[] {
  return Array.from({ length: count }, () => generateTestAuditLog());
}

export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function cleanupTestData(mongoService: any): Promise<void> {}
