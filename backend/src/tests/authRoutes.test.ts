import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { registerHandler, loginHandler } from '../routes/auth';
import { UserModel } from '../models/User.model';

const app = express();
app.use(express.json());
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/login', loginHandler);

describe('Auth Routes Unit Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test-auth-routes';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should succeed with valid data', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('jwt');
      expect(response.body).toHaveProperty('did');
      expect(response.body).toHaveProperty('vc');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('auditHash');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'User 1',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/register').send({
        name: 'User 2',
        email: 'test@example.com',
        password: 'password456',
      });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Email already registered');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Name and email are required');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Name and email are required');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should succeed with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jwt');
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });
});
