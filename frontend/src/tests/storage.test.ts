import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveJWT, loadJWT, saveCredentials, loadCredentials } from '../utils/storage';

describe('Session Persistence Unit Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe('JWT Persistence', () => {
    it('should save JWT to storage', async () => {
      const jwt = 'test.jwt.token';

      await saveJWT(jwt);

      const stored = await AsyncStorage.getItem('jwt');

      expect(stored).toBe(jwt);
    });

    it('should load JWT from storage', async () => {
      const jwt = 'test.jwt.token';

      await AsyncStorage.setItem('jwt', jwt);

      const loaded = await loadJWT();

      expect(loaded).toBe(jwt);
    });

    it('should return null when no JWT is stored', async () => {
      const loaded = await loadJWT();

      expect(loaded).toBeNull();
    });

    it('should overwrite existing JWT', async () => {
      await saveJWT('old.jwt.token');
      await saveJWT('new.jwt.token');

      const loaded = await loadJWT();

      expect(loaded).toBe('new.jwt.token');
    });
  });

  describe('Credentials Persistence', () => {
    it('should save credentials to storage', async () => {
      const credentials = {
        did: 'did:example:123',
        vc: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential'],
          issuer: 'did:example:issuer',
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: 'did:example:123',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      };

      await saveCredentials(credentials);

      const stored = await AsyncStorage.getItem('credentials');

      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(credentials);
    });

    it('should load credentials from storage', async () => {
      const credentials = {
        did: 'did:example:123',
        vc: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential'],
          issuer: 'did:example:issuer',
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: 'did:example:123',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      };

      await AsyncStorage.setItem('credentials', JSON.stringify(credentials));

      const loaded = await loadCredentials();

      expect(loaded).toEqual(credentials);
    });

    it('should return null when no credentials are stored', async () => {
      const loaded = await loadCredentials();

      expect(loaded).toBeNull();
    });
  });

  describe('Authentication State Restoration', () => {
    it('should restore authentication state correctly', async () => {
      const jwt = 'test.jwt.token';
      const credentials = {
        did: 'did:example:123',
        vc: {} as any,
      };

      await saveJWT(jwt);
      await saveCredentials(credentials);

      const loadedJWT = await loadJWT();
      const loadedCredentials = await loadCredentials();

      expect(loadedJWT).toBe(jwt);
      expect(loadedCredentials).toEqual(credentials);
      expect(!!loadedJWT).toBe(true);
    });

    it('should handle partial session data', async () => {
      await saveJWT('test.jwt.token');

      const loadedJWT = await loadJWT();
      const loadedCredentials = await loadCredentials();

      expect(loadedJWT).toBe('test.jwt.token');
      expect(loadedCredentials).toBeNull();
    });
  });
});
