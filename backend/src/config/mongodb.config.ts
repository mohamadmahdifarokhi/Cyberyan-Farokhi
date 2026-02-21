import mongoose from 'mongoose';

export const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  autoIndex: true,
  autoCreate: true,
};

export const getMongoURL = (): string => {
  const url = process.env.MONGODB_URL;
  if (!url) {
    throw new Error('MONGODB_URL environment variable is not defined');
  }
  return url;
};

export const retryConfig = {
  maxRetries: 5,
  retryDelay: 1000,
  backoffMultiplier: 2,
};
