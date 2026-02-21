import { faker } from '@faker-js/faker';

export class DIDService {
  generateDID(): string {
    const uuid = faker.string.uuid();
    return `did:example:${uuid}`;
  }
}

export const didService = new DIDService();
