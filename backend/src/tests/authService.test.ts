import { authService } from '../services/authService';
import { UserModel } from '../models/User.model';
import mongoose from 'mongoose';

describe('Auth Service Unit Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test-auth';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  describe('Password Hashing', () => {
    it('should produce different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(password);
      expect(hash2).not.toBe(password);
    });
  });

  describe('Password Comparison', () => {
    it('should succeed with correct password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      const result = await authService.comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should fail with incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await authService.hashPassword(password);
      const result = await authService.comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe('User Registration', () => {
    it('should create account with hashed password', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';
      const name = 'Test User';

      const user = await authService.registerUser(email, password, name);

      expect(user).toBeDefined();
      expect(user.email).toBe(email.toLowerCase());
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(password);
      expect(user.name).toBe(name);
    });

    it('should throw error for duplicate email', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';

      await authService.registerUser(email, password, 'User 1');

      await expect(authService.registerUser(email, password, 'User 2')).rejects.toThrow('User already exists');
    });

    it('should throw error for short password', async () => {
      const email = 'test@example.com';
      const password = 'short';

      await expect(authService.registerUser(email, password, 'Test User')).rejects.toThrow(
        'Password must be at least 8 characters',
      );
    });
  });

  describe('User Authentication', () => {
    it('should succeed with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';
      const name = 'Test User';

      await authService.registerUser(email, password, name);
      const user = await authService.authenticateUser(email, password);

      expect(user).toBeDefined();
      expect(user?.email).toBe(email.toLowerCase());
      expect(user?.name).toBe(name);
    });

    it('should fail with invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';

      await authService.registerUser(email, password, 'Test User');
      const user = await authService.authenticateUser(email, wrongPassword);

      expect(user).toBeNull();
    });

    it('should fail with non-existent email', async () => {
      const user = await authService.authenticateUser('nonexistent@example.com', 'password123');

      expect(user).toBeNull();
    });
  });
});
