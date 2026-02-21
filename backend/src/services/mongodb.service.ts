import mongoose from 'mongoose';
import { getMongoURL, mongoOptions, retryConfig } from '../config/mongodb.config';
import { CredentialModel, ICredential } from '../models/Credential.model';
import { AuditLogModel, IAuditLog } from '../models/AuditLog.model';
import { AnalyticsModel, IAnalytics } from '../models/Analytics.model';
const logger = {
  info: (message: string, meta?: any) => console.log('[INFO]', message, meta || ''),
  error: (message: string, meta?: any) => console.error('[ERROR]', message, meta || ''),
  warn: (message: string, meta?: any) => console.warn('[WARN]', message, meta || ''),
  debug: (message: string, meta?: any) => console.log('[DEBUG]', message, meta || ''),
};
export interface AuditLogFilters {
  did?: string;
  operation?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
export interface TrendData {
  date: string;
  count: number;
}
export class MongoDBService {
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  async connect(): Promise<void> {
    const { maxRetries, retryDelay, backoffMultiplier } = retryConfig;
    while (this.connectionAttempts < maxRetries) {
      try {
        const mongoURL = getMongoURL();
        mongoose.connection.on('connected', () => {
          logger.info('MongoDB connected successfully');
          this.isConnected = true;
        });
        mongoose.connection.on('error', (err) => {
          logger.error('MongoDB connection error:', err);
          this.isConnected = false;
        });
        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected, attempting reconnection...');
          this.isConnected = false;
        });
        mongoose.connection.on('reconnected', () => {
          logger.info('MongoDB reconnected successfully');
          this.isConnected = true;
        });
        await mongoose.connect(mongoURL, mongoOptions);
        logger.info('MongoDB connection established');
        this.connectionAttempts = 0;
        return;
      } catch (error) {
        this.connectionAttempts++;
        const delay = retryDelay * Math.pow(backoffMultiplier, this.connectionAttempts - 1);
        logger.error(`MongoDB connection failed (attempt ${this.connectionAttempts}/${maxRetries})`, {
          error: error instanceof Error ? error.message : error,
        });
        if (this.connectionAttempts >= maxRetries) {
          throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
        }
        logger.info(`Retrying connection in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }
  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
  getConnectionStatus(): string {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return states[mongoose.connection.readyState] || 'unknown';
  }
  async saveCredential(credential: Partial<ICredential>): Promise<ICredential> {
    try {
      const doc = new CredentialModel(credential);
      const saved = await doc.save();
      logger.info('Credential saved successfully', { did: saved.did });
      return saved;
    } catch (error) {
      logger.error('Error saving credential:', error);
      throw error;
    }
  }
  async getCredential(did: string): Promise<ICredential | null> {
    try {
      const credential = await CredentialModel.findOne({ did });
      if (credential) {
        logger.debug('Credential retrieved', { did });
      }
      return credential;
    } catch (error) {
      logger.error('Error retrieving credential:', error);
      throw error;
    }
  }
  async searchCredentials(query: string): Promise<ICredential[]> {
    try {
      const credentials = await CredentialModel.find({
        $or: [
          { did: { $regex: query, $options: 'i' } },
          { 'userInfo.name': { $regex: query, $options: 'i' } },
          { 'userInfo.email': { $regex: query, $options: 'i' } },
        ],
      }).limit(50);
      logger.debug('Credentials search completed', { query, count: credentials.length });
      return credentials;
    } catch (error) {
      logger.error('Error searching credentials:', error);
      throw error;
    }
  }
  async getAllCredentials(limit: number = 50, offset: number = 0): Promise<ICredential[]> {
    try {
      const credentials = await CredentialModel.find().sort({ createdAt: -1 }).skip(offset).limit(limit);
      logger.debug('Credentials retrieved', { count: credentials.length });
      return credentials;
    } catch (error) {
      logger.error('Error retrieving credentials:', error);
      throw error;
    }
  }
  async updateFCMToken(did: string, fcmToken: string): Promise<void> {
    try {
      await CredentialModel.updateOne({ did }, { fcmToken });
      logger.info('FCM token updated', { did });
    } catch (error) {
      logger.error('Error updating FCM token:', error);
      throw error;
    }
  }
  async saveAuditLog(log: Partial<IAuditLog>): Promise<IAuditLog> {
    try {
      const doc = new AuditLogModel(log);
      const saved = await doc.save();
      logger.debug('Audit log saved', { did: saved.did, operation: saved.operation });
      return saved;
    } catch (error) {
      logger.error('Error saving audit log:', error);
      throw error;
    }
  }
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<{ logs: IAuditLog[]; total: number; hasMore: boolean }> {
    try {
      const { did, operation, startDate, endDate, limit = 50, offset = 0 } = filters;
      const query: any = {};
      if (did) query.did = did;
      if (operation) query.operation = operation;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }
      const [logs, total] = await Promise.all([
        AuditLogModel.find(query).sort({ timestamp: -1 }).skip(offset).limit(limit),
        AuditLogModel.countDocuments(query),
      ]);
      const hasMore = offset + logs.length < total;
      logger.debug('Audit logs retrieved', { count: logs.length, total });
      return { logs, total, hasMore };
    } catch (error) {
      logger.error('Error retrieving audit logs:', error);
      throw error;
    }
  }
  async getRegistrationCount(): Promise<number> {
    try {
      const count = await CredentialModel.countDocuments();
      logger.debug('Registration count retrieved', { count });
      return count;
    } catch (error) {
      logger.error('Error getting registration count:', error);
      throw error;
    }
  }
  async getRegistrationTrend(days: number): Promise<TrendData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const trend = await CredentialModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1,
          },
        },
      ]);
      logger.debug('Registration trend retrieved', { days, dataPoints: trend.length });
      return trend;
    } catch (error) {
      logger.error('Error getting registration trend:', error);
      throw error;
    }
  }
  async getAverageProcessingTime(): Promise<number> {
    try {
      const result = await AuditLogModel.aggregate([
        {
          $match: {
            processingTime: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$processingTime' },
          },
        },
      ]);
      const avgTime = result.length > 0 ? result[0].avgTime : 0;
      logger.debug('Average processing time retrieved', { avgTime });
      return avgTime;
    } catch (error) {
      logger.error('Error getting average processing time:', error);
      throw error;
    }
  }
  async recordAnalytics(date: Date, registrationCount: number, processingTime: number): Promise<void> {
    try {
      const dateOnly = new Date(date.toISOString().split('T')[0]);
      await AnalyticsModel.findOneAndUpdate(
        { date: dateOnly },
        {
          $inc: {
            registrationCount: registrationCount,
            totalProcessingTime: processingTime,
          },
          $set: {
            averageProcessingTime: processingTime / registrationCount,
          },
        },
        { upsert: true, new: true },
      );
      logger.debug('Analytics recorded', { date: dateOnly, registrationCount });
    } catch (error) {
      logger.error('Error recording analytics:', error);
      throw error;
    }
  }
}
export const mongoDBService = new MongoDBService();
