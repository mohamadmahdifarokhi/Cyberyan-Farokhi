import { mongoDBService } from './mongodb.service';
import { rabbitmqService } from './rabbitmq.service';
import { logger } from '../utils/logger';
export interface AnalyticsMetrics {
  totalRegistrations: number;
  registrationTrend: Array<{ date: string; count: number }>;
  averageProcessingTime: number;
  peakHours: Array<{ hour: number; count: number }>;
}
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    mongodb: 'healthy' | 'degraded' | 'down';
    rabbitmq: 'healthy' | 'degraded' | 'down';
    api: 'healthy' | 'degraded' | 'down';
  };
  uptime: number;
  timestamp: string;
}
export class AnalyticsService {
  private startTime: number = Date.now();
  async recordRegistration(did: string, processingTime: number): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await mongoDBService.recordAnalytics(today, 1, processingTime);
      logger.debug('Analytics recorded', { did, processingTime });
    } catch (error) {
      logger.error('Error recording analytics:', error);
    }
  }
  async getMetrics(): Promise<AnalyticsMetrics> {
    try {
      const totalRegistrations = await mongoDBService.getRegistrationCount();
      const registrationTrend = await mongoDBService.getRegistrationTrend(30);
      const averageProcessingTime = await mongoDBService.getAverageProcessingTime();
      return {
        totalRegistrations,
        registrationTrend,
        averageProcessingTime,
        peakHours: [],
      };
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw error;
    }
  }
  async getSystemHealth(): Promise<SystemHealth> {
    let mongodb: 'healthy' | 'degraded' | 'down' = 'down';
    let rabbitmq: 'healthy' | 'degraded' | 'down' = 'down';
    try {
      mongodb = mongoDBService.isHealthy() ? 'healthy' : 'down';
    } catch (error) {
      logger.error('Error checking MongoDB health:', error);
    }
    try {
      rabbitmq = rabbitmqService.isHealthy() ? 'healthy' : 'down';
    } catch (error) {
      logger.error('Error checking RabbitMQ health:', error);
    }
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const allHealthy = mongodb === 'healthy' && rabbitmq === 'healthy';
    const anyDown = mongodb === 'down' || rabbitmq === 'down';
    const status = allHealthy ? 'healthy' : anyDown ? 'degraded' : 'degraded';
    return {
      status,
      services: {
        mongodb,
        rabbitmq,
        api: 'healthy',
      },
      uptime,
      timestamp: new Date().toISOString(),
    };
  }
}
export const analyticsService = new AnalyticsService();
